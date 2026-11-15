import { advance } from "@/lib/game/engine";
import { checkOrigin, HttpError, json, readJson, requireUser, route } from "@/lib/server/http";
import { loadJob, persist, viewOf } from "@/lib/server/jobs";

/** Move on to the next decision, stage summary, or stage. */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/advance">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readJson(request);
  const job = await loadJob(id, user.id);

  // The browser says which screen it was on, so a double tap can't skip a step.
  if (typeof body.from === "string" && body.from !== job.state.phase) {
    throw new HttpError(409, "This job has already moved on. Reloading it.", "stale");
  }
  const saved = await persist(job, advance(job.state, new Date().toISOString()));
  return json({ view: viewOf(saved) });
});
