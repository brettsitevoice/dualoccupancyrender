import { aiEnabled, speak } from "@/lib/ai/foreman";
import { briefingPrompt } from "@/lib/ai/prompts";
import { fallbackBriefing, hud } from "@/lib/game/engine";
import { STAGES } from "@/lib/game/stages";
import { checkOrigin, HttpError, requireUser, route } from "@/lib/server/http";
import { loadJob } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { getJob, saveJob } from "@/lib/server/store";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

/** The foreman's briefing at the start of a stage. Generated once, then saved with the job. */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/briefing">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await loadJob(id, user.id);
  const state = job.state;
  if (state.phase !== "stage_intro") {
    throw new HttpError(409, "This job has already moved on. Reloading it.", "stale");
  }
  const stage = STAGES[state.stageIdx];
  const existing = state.briefings[stage.id];

  return eventStream(request, async (send, signal) => {
    if (existing) {
      send({ t: "delta", text: existing.text });
      send({ t: "done", ai: existing.ai });
      return;
    }

    let text: string | null = null;
    if (aiEnabled() && allow(`ai:${user.id}`, LIMITS.ai)) {
      const previous = state.stageIdx > 0 ? STAGES[state.stageIdx - 1] : null;
      const result = await speak({
        prompt: briefingPrompt({
          site: state.site,
          stage,
          hud: hud(state),
          previous: previous ? state.ledger.filter((entry) => entry.stage === previous.id) : [],
          previousStageName: previous?.name ?? null,
        }),
        signal,
        onText: deltaSender(send),
      });
      if (result.ok) text = result.text;
      else if (result.reason === "aborted") return;
      else send({ t: "reset" });
    }

    const ai = text !== null;
    if (text === null) {
      text = fallbackBriefing(state);
      send({ t: "delta", text });
    }

    // Save it so coming back to this screen doesn't generate it again.
    const fresh = await getJob(id, user.id);
    if (fresh && fresh.state.phase === "stage_intro" && fresh.state.stageIdx === state.stageIdx) {
      await saveJob(fresh, {
        ...fresh.state,
        briefings: { ...fresh.state.briefings, [stage.id]: { text, ai } },
      });
    }
    send({ t: "done", ai });
  });
});
