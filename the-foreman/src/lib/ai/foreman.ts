import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { Quality } from "@/lib/game/types";
import { readPartialString } from "./partial-json";
import { ASSESS_FORMAT, SYSTEM_PROMPT } from "./prompts";

// The foreman is Claude Fable 5.2, called through the Anthropic API from the
// server only. The API key never reaches the browser.

export const FOREMAN_MODEL = process.env.FOREMAN_MODEL || "claude-fable-5-2";

type Effort = "low" | "medium" | "high";

function effortFrom(value: string | undefined, fallback: Effort): Effort {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

/** Quick back-and-forth turns run at low effort so replies come back fast on a phone. */
const CHAT_EFFORT = effortFrom(process.env.FOREMAN_EFFORT, "low");
/** Looking at a photo of real work deserves more care. */
const PHOTO_EFFORT = effortFrom(process.env.FOREMAN_PHOTO_EFFORT, "medium");

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment.
  client ??= new Anthropic({ maxRetries: 1, timeout: 120_000 });
  return client;
}

export type ForemanFailure = "disabled" | "refused" | "aborted" | "error";

export type TextResult = { ok: true; text: string } | { ok: false; reason: ForemanFailure };

type UserContent = Anthropic.Beta.BetaContentBlockParam[] | string;

interface RunOptions {
  user: UserContent;
  effort: Effort;
  structured?: boolean;
  signal?: AbortSignal;
  /** Called with the full text received so far, each time more arrives. */
  onProgress?: (textSoFar: string) => void;
}

function logFailure(error: unknown): void {
  // Most specific first, so the server log says what actually went wrong.
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("[foreman] Anthropic API key was rejected. Check ANTHROPIC_API_KEY.");
  } else if (error instanceof Anthropic.PermissionDeniedError) {
    console.error("[foreman] This API key isn't allowed to use the model:", error.message);
  } else if (error instanceof Anthropic.NotFoundError) {
    console.error(`[foreman] Model "${FOREMAN_MODEL}" was not found:`, error.message);
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error("[foreman] Anthropic rate limit reached. The request was not completed.");
  } else if (error instanceof Anthropic.BadRequestError) {
    console.error("[foreman] Anthropic rejected the request:", error.message);
  } else if (error instanceof Anthropic.APIConnectionError) {
    console.error("[foreman] Couldn't reach the Anthropic API:", error.message);
  } else if (error instanceof Anthropic.APIError) {
    console.error(`[foreman] Anthropic API error ${error.status}:`, error.message);
  } else {
    console.error("[foreman] Unexpected error calling the foreman:", error);
  }
}

async function run(options: RunOptions): Promise<TextResult> {
  if (!aiEnabled()) return { ok: false, reason: "disabled" };

  try {
    const stream = getClient().beta.messages.stream(
      {
        model: FOREMAN_MODEL,
        // Thinking is always on for this model and counts towards this limit,
        // so leave plenty of room even though the replies themselves are short.
        max_tokens: 16000,
        // If the model's safety classifiers decline a request, let the API
        // retry it on Anthropic's recommended fallback model in the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        output_config: {
          effort: options.effort,
          ...(options.structured ? { format: ASSESS_FORMAT } : {}),
        },
        messages: [{ role: "user", content: options.user }],
      },
      { signal: options.signal },
    );

    let soFar = "";
    stream.on("text", (delta) => {
      soFar += delta;
      options.onProgress?.(soFar);
    });

    const message = await stream.finalMessage();

    // A refusal comes back as a normal response, so check before reading content.
    if (message.stop_reason === "refusal") {
      console.warn("[foreman] The model declined this request:", message.stop_details?.category ?? "no category");
      return { ok: false, reason: "refused" };
    }

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (!text) {
      console.warn(`[foreman] Empty reply (stop_reason: ${message.stop_reason}).`);
      return { ok: false, reason: "error" };
    }
    return { ok: true, text };
  } catch (error) {
    if (error instanceof Anthropic.APIUserAbortError || options.signal?.aborted) {
      return { ok: false, reason: "aborted" };
    }
    logFailure(error);
    return { ok: false, reason: "error" };
  }
}

/** Ask the foreman for a plain-text reply, streaming it as it arrives. */
export function speak(input: {
  prompt: string;
  signal?: AbortSignal;
  onText?: (textSoFar: string) => void;
}): Promise<TextResult> {
  return run({ user: input.prompt, effort: CHAT_EFFORT, signal: input.signal, onProgress: input.onText });
}

/** Ask the foreman to look at a photo. */
export function lookAtPhoto(input: {
  prompt: string;
  /** JPEG image as base64. */
  image: string;
  signal?: AbortSignal;
  onText?: (textSoFar: string) => void;
}): Promise<TextResult> {
  return run({
    user: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.image } },
      { type: "text", text: input.prompt },
    ],
    effort: PHOTO_EFFORT,
    signal: input.signal,
    onProgress: input.onText,
  });
}

export interface Assessment {
  verdict: Quality | "unclear";
  /** The option id the answer is closest to, or null. */
  closest: string | null;
  feedback: string;
}

export type AssessResult = { ok: true; assessment: Assessment } | { ok: false; reason: ForemanFailure };

const VERDICTS = ["good", "partial", "poor", "unclear"] as const;

function isVerdict(value: unknown): value is Assessment["verdict"] {
  return typeof value === "string" && (VERDICTS as readonly string[]).includes(value);
}

/**
 * Ask the foreman to judge an answer given in the student's own words.
 * The reply is JSON; `onVerdict` fires as soon as the verdict is known and
 * `onFeedback` fires as the explanation streams in.
 */
export async function assess(input: {
  prompt: string;
  signal?: AbortSignal;
  onVerdict?: (verdict: Assessment["verdict"], closest: string | null) => void;
  onFeedback?: (feedbackSoFar: string) => void;
}): Promise<AssessResult> {
  let verdictSent = false;
  const result = await run({
    user: input.prompt,
    effort: CHAT_EFFORT,
    structured: true,
    signal: input.signal,
    onProgress: (json) => {
      const feedback = readPartialString(json, "feedback");
      if (!feedback) return;
      // The schema puts verdict and closest before feedback, so once feedback
      // has started both are complete.
      if (!verdictSent) {
        const verdict = readPartialString(json, "verdict");
        const closest = readPartialString(json, "closest");
        if (verdict?.done && isVerdict(verdict.value)) {
          verdictSent = true;
          input.onVerdict?.(verdict.value, closest?.done && closest.value !== "none" ? closest.value : null);
        }
      }
      if (verdictSent) input.onFeedback?.(feedback.value);
    },
  });
  if (!result.ok) return result;

  try {
    const parsed: unknown = JSON.parse(result.text);
    if (parsed && typeof parsed === "object") {
      const { verdict, closest, feedback } = parsed as Record<string, unknown>;
      if (isVerdict(verdict) && typeof feedback === "string" && feedback.trim()) {
        return {
          ok: true,
          assessment: {
            verdict,
            closest: typeof closest === "string" && closest !== "none" ? closest : null,
            feedback: feedback.trim(),
          },
        };
      }
    }
  } catch {
    // fall through
  }
  console.warn("[foreman] The assessment reply wasn't in the expected format.");
  return { ok: false, reason: "error" };
}
