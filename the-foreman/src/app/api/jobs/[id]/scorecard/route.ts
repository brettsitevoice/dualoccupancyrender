import { buildScorecard } from "@/lib/game/scorecard";
import { HttpError, json, requireUser, route } from "@/lib/server/http";
import { loadJob, photoView } from "@/lib/server/jobs";
import { listPhotos } from "@/lib/server/store";

/** Everything the debrief screen needs for a finished job. */
export const GET = route(async (_request: Request, ctx: RouteContext<"/api/jobs/[id]/scorecard">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await loadJob(id, user.id);
  if (job.state.phase !== "complete") {
    throw new HttpError(409, "The scorecard is ready once the build is handed over.", "not_complete");
  }
  const photos = await listPhotos(user.id, job.id);
  return json({
    id: job.id,
    title: job.title,
    student: user.name,
    site: job.state.site,
    length: job.state.length,
    startedAt: job.state.startedAt,
    completedAt: job.state.completedAt,
    card: buildScorecard(job.state),
    debrief: job.state.debrief,
    photos: photos.filter((photo) => photo.status === "complete").map((photo) => photoView(photo, false)),
  });
});
