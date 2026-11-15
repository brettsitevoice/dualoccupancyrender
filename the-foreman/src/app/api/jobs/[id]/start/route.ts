import { startGame } from "@/lib/game/engine";
import { checkOrigin, HttpError, json, readJson, requireUser, route } from "@/lib/server/http";
import { loadJob, persist, viewOf } from "@/lib/server/jobs";

/** Start the build: the student picks a quick or a full build. */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/jobs/[id]/start">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readJson(request);
  const length = body.length;
  if (length !== "quick" && length !== "full") throw new HttpError(400, "Choose a quick or a full build.");

  const job = await loadJob(id, user.id);
  const saved = await persist(job, startGame(job.state, length, new Date().toISOString()));
  return json({ view: viewOf(saved) });
});
