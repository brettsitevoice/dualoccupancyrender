import "server-only";

import type { StreamEvent } from "@/lib/stream-events";

/**
 * Stream a series of events to the browser as newline-delimited JSON.
 * `signal` aborts when the browser goes away, so work in progress (such as a
 * call to the Anthropic API) can be stopped.
 */
export function eventStream(
  request: Request,
  work: (send: (event: StreamEvent) => void, signal: AbortSignal) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: StreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      try {
        await work(send, abort.signal);
      } catch (error) {
        console.error("[foreman] stream failed", error);
        send({ t: "error", message: "Something went wrong on our end. Try again." });
      } finally {
        open = false;
        try {
          controller.close();
        } catch {
          // already closed by the browser
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Turns "full text so far" callbacks into "new text since last time" events. */
export function deltaSender(send: (event: StreamEvent) => void): (textSoFar: string) => void {
  let sent = 0;
  return (textSoFar) => {
    if (textSoFar.length > sent) {
      send({ t: "delta", text: textSoFar.slice(sent) });
      sent = textSoFar.length;
    }
  };
}
