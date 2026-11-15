import { aiEnabled, assess, speak } from "@/lib/ai/foreman";
import { spokenAssessmentPrompt, tapFeedbackPrompt } from "@/lib/ai/prompts";
import {
  applyAnswer,
  currentDecision,
  describeDecision,
  resolveSpoken,
  resolveTap,
  setLastFeedback,
} from "@/lib/game/engine";
import { STAGES } from "@/lib/game/stages";
import { checkOrigin, HttpError, readJson, requireUser, route, str } from "@/lib/server/http";
import { loadJob, persist, viewOf } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { getJob, saveJob, type JobRow } from "@/lib/server/store";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

/** Store the foreman's AI feedback against the answer it belongs to. */
async function saveFeedback(jobId: string, userId: string, decisionId: string, feedback: string): Promise<JobRow | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const job = await getJob(jobId, userId);
    if (!job) return null;
    const next = setLastFeedback(job.state, decisionId, feedback);
    if (next === job.state) return null;
    const saved = await saveJob(job, next);
    if (saved) return saved;
  }
  return null;
}

/**
 * Answer the current decision, either by tapping an option ({ optionId }) or
 * in the student's own words ({ text, mode }). The reply streams back.
 */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/answer">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readJson(request);

  const job = await loadJob(id, user.id);
  const decision = currentDecision(job.state);
  if (job.state.phase !== "decision" || !decision) {
    throw new HttpError(409, "This job has already moved on. Reloading it.", "stale");
  }
  if (typeof body.decisionId === "string" && body.decisionId !== decision.id) {
    throw new HttpError(409, "This job has already moved on. Reloading it.", "stale");
  }
  const stage = STAGES[job.state.stageIdx];
  const { situation } = describeDecision(job.state, decision);
  const site = job.state.site;

  // --- Tapped option: the rating is authored, the foreman explains it. ---
  if (typeof body.optionId === "string") {
    const resolved = resolveTap(decision, body.optionId);
    const chosen = decision.options.find((option) => option.id === body.optionId)!;
    const saved = await persist(
      job,
      applyAnswer(
        job.state,
        { mode: "tap", answer: chosen.label, resolved, feedback: "", aiFeedback: false },
        new Date().toISOString(),
      ),
    );

    return eventStream(request, async (send, signal) => {
      send({ t: "view", view: viewOf(saved) });
      if (!aiEnabled() || !allow(`ai:${user.id}`, LIMITS.ai)) {
        send({ t: "done", ai: false });
        return;
      }
      const result = await speak({
        prompt: tapFeedbackPrompt({ site, stage, decision, situation, chosenLabel: chosen.label, resolved }),
        signal,
        onText: deltaSender(send),
      });
      if (!result.ok) {
        // The authored explanation is already on screen via the view.
        send({ t: "reset" });
        send({ t: "done", ai: false });
        return;
      }
      const withFeedback = await saveFeedback(id, user.id, decision.id, result.text);
      if (withFeedback) send({ t: "view", view: viewOf(withFeedback) });
      send({ t: "done", ai: true });
    });
  }

  // --- Own words (voice or typed): the foreman judges it. ---
  const text = str(body.text, 700);
  const mode = body.mode === "voice" ? "voice" : "text";
  if (text.length < 3) throw new HttpError(400, "Say or type a bit more than that.");
  if (!aiEnabled()) {
    throw new HttpError(503, "The AI foreman isn't connected, so tap one of the options instead.", "ai_off");
  }
  if (!allow(`ai:${user.id}`, LIMITS.ai)) {
    throw new HttpError(429, "Give the foreman a minute to catch up. Tap an option for now.");
  }

  return eventStream(request, async (send, signal) => {
    const sendDelta = deltaSender(send);
    const result = await assess({
      prompt: spokenAssessmentPrompt({ site, stage, decision, situation, answer: text, mode }),
      signal,
      onVerdict: (verdict) => send({ t: "verdict", verdict }),
      onFeedback: sendDelta,
    });
    if (!result.ok) {
      if (result.reason !== "aborted") {
        send({ t: "error", message: "The foreman couldn't be reached. Tap an option instead." });
      }
      return;
    }

    const { verdict, closest, feedback } = result.assessment;
    send({ t: "verdict", verdict });
    sendDelta(feedback);
    if (verdict === "unclear") {
      // Nothing is recorded: the student gets another go.
      send({ t: "done", ai: true });
      return;
    }

    // Re-read the job so a slow reply can't be recorded against the wrong decision.
    const fresh = await getJob(id, user.id);
    if (!fresh || fresh.state.phase !== "decision" || currentDecision(fresh.state)?.id !== decision.id) {
      send({ t: "error", message: "This job has already moved on." });
      return;
    }
    const saved = await saveJob(
      fresh,
      applyAnswer(
        fresh.state,
        { mode, answer: text, resolved: resolveSpoken(decision, verdict, closest), feedback, aiFeedback: true },
        new Date().toISOString(),
      ),
    );
    if (!saved) {
      send({ t: "error", message: "This job has already moved on." });
      return;
    }
    send({ t: "view", view: viewOf(saved) });
    send({ t: "done", ai: true });
  });
});
