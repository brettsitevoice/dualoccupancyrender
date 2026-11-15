import "server-only";

import { unstable_rethrow } from "next/navigation";
import { GameError } from "@/lib/game/engine";
import { getSessionUser, type SessionUser } from "./auth";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(status: number, message: string, code?: string): Response {
  return json({ error: message, code: code ?? null }, status);
}

/** Thrown inside a route to send an error response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** Read the request body as text, giving up as soon as it goes over the limit. */
async function readCapped(request: Request, maxBytes: number): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new HttpError(413, "That's too much to send in one go.");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new HttpError(413, "That's too much to send in one go.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/** Read a JSON body, rejecting anything too large or malformed. */
export async function readJson(request: Request, maxBytes = 16_000): Promise<Record<string, unknown>> {
  const raw = await readCapped(request, maxBytes);
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Couldn't read that request.");
  }
}

/**
 * Reject state-changing requests that come from another website. The session
 * cookie is SameSite=Lax, which already blocks most of these; this is a
 * second check.
 */
export function checkOrigin(request: Request): void {
  // Browsers say where a request came from. This is set by the browser itself
  // and works whatever proxy or preview address sits in front of the app.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) {
    if (fetchSite === "same-origin" || fetchSite === "none") return;
    throw new HttpError(403, "Request blocked.");
  }
  // Older browsers: compare the Origin header with the host instead.
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Request blocked.");
  }
  if (host && originHost !== host) throw new HttpError(403, "Request blocked.");
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Please sign in.", "signed_out");
  return user;
}

/** True when the student reached the app over HTTPS (directly or through a proxy). */
export function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return (forwarded ?? new URL(request.url).protocol.replace(":", "")) === "https";
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Wrap a route handler so thrown errors become tidy JSON responses. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Let Next.js's own control-flow errors through (for example, the signal
      // it uses during a build to mark a route as request-time only).
      unstable_rethrow(error);
      if (error instanceof HttpError) return fail(error.status, error.message, error.code);
      if (error instanceof GameError) return fail(409, error.message, error.code);
      console.error("[foreman] request failed", error);
      return fail(500, "Something went wrong on our end. Try again.");
    }
  };
}
