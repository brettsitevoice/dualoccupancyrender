import { aiEnabled, speak } from "@/lib/ai/foreman";
import { debriefPrompt } from "@/lib/ai/prompts";
import { buildScorecard, fallbackDebrief } from "@/lib/game/scorecard";
import { checkOrigin, HttpError, requireUser, route } from "@/lib/server/http";
import { loadJob } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { getJob, saveJob } from "@/lib/server/store";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

/** The foreman's spoken debrief at the end of the build. Generated once, then saved. */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/debrief">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await loadJob(id, user.id);
  const state = job.state;
  if (state.phase !== "complete") throw new HttpError(409, "The debrief comes at the end of the build.");

  return eventStream(request, async (send, signal) => {
    if (state.debrief) {
      send({ t: "delta", text: state.debrief.text });
      send({ t: "done", ai: state.debrief.ai });
      return;
    }

    const card = buildScorecard(state);
    let text: string | null = null;
    if (aiEnabled() && allow(`ai:${user.id}`, LIMITS.ai)) {
      const result = await speak({
        prompt: debriefPrompt({ site: state.site, card }),
        signal,
        onText: deltaSender(send),
      });
      if (result.ok) text = result.text;
      else if (result.reason === "aborted") return;
      else send({ t: "reset" });
    }

    const ai = text !== null;
    if (text === null) {
      text = fallbackDebrief(state, card);
      send({ t: "delta", text });
    }

    const fresh = await getJob(id, user.id);
    if (fresh && fresh.state.phase === "complete" && !fresh.state.debrief) {
      await saveJob(fresh, { ...fresh.state, debrief: { text, ai } });
    }
    send({ t: "done", ai });
  });
});
