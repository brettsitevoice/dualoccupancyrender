import { aiEnabled, speak } from "@/lib/ai/foreman";
import { askPrompt } from "@/lib/ai/prompts";
import { currentDecision, describeDecision } from "@/lib/game/engine";
import { STAGES } from "@/lib/game/stages";
import { checkOrigin, HttpError, readJson, requireUser, route, str } from "@/lib/server/http";
import { loadJob } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

/** A follow-up question to the foreman about the decision just made. */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/ask">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readJson(request);
  const question = str(body.question, 400);
  if (question.length < 3) throw new HttpError(400, "Ask a bit more than that.");

  const job = await loadJob(id, user.id);
  const state = job.state;
  const decision = currentDecision(state);
  const entry = state.ledger[state.ledger.length - 1];
  // Only after answering, so the foreman can't be asked for the answer first.
  if (state.phase !== "feedback" || !decision || entry?.decisionId !== decision.id) {
    throw new HttpError(409, "You can ask the foreman once you've made your call.", "stale");
  }
  if (!aiEnabled()) throw new HttpError(503, "The AI foreman isn't connected right now.", "ai_off");
  if (!allow(`ai:${user.id}`, LIMITS.ai)) {
    throw new HttpError(429, "Give the foreman a minute to catch up, then ask again.");
  }

  return eventStream(request, async (send, signal) => {
    const result = await speak({
      prompt: askPrompt({
        site: state.site,
        stage: STAGES[state.stageIdx],
        decision,
        situation: describeDecision(state, decision).situation,
        entry,
        question,
      }),
      signal,
      onText: deltaSender(send),
    });
    if (result.ok) send({ t: "done", ai: true });
    else if (result.reason !== "aborted") {
      send({ t: "error", message: "The foreman couldn't be reached. Try again in a moment." });
    }
  });
});
