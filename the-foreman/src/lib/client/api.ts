import type { StreamEvent } from "@/lib/stream-events";

// Browser-side helpers for talking to the app's own API.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string | null = null,
  ) {
    super(message);
  }
}

/**
 * Go to another screen with a full page load. Used whenever the signed-in
 * student changes (sign in, sign out, expired session): the app keeps recent
 * screens alive in the background, and a full load makes sure nothing from one
 * student's session is left behind for the next person on a shared device.
 */
export function hardNavigate(path: "/" | "/login"): void {
  window.location.replace(path);
}

async function failure(response: Response): Promise<ApiError> {
  let message = "Something went wrong. Try again.";
  let code: string | null = null;
  try {
    const data = (await response.json()) as { error?: string; code?: string | null };
    if (data.error) message = data.error;
    code = data.code ?? null;
  } catch {
    // not JSON; keep the default message
  }
  if (response.status === 401 && code === "signed_out" && window.location.pathname !== "/login") {
    hardNavigate("/login");
  }
  return new ApiError(response.status, message, code);
}

export async function api<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!response.ok) throw await failure(response);
  return (await response.json()) as T;
}

/**
 * POST to a streaming endpoint and hand each event to `onEvent` as it arrives.
 * Resolves when the stream ends. Rejects with ApiError if the request is refused.
 */
export async function stream(
  path: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!response.ok || !response.body) throw await failure(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const flush = (line: string) => {
    if (!line.trim()) return;
    try {
      onEvent(JSON.parse(line) as StreamEvent);
    } catch {
      // ignore a malformed line rather than dropping the whole reply
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      flush(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
    }
  }
  flush(buffer + decoder.decode());
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}
