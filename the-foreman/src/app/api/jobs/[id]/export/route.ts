import { buildScorecard } from "@/lib/game/scorecard";
import { renderEvidence } from "@/lib/server/export";
import { HttpError, requireUser, route } from "@/lib/server/http";
import { loadJob } from "@/lib/server/jobs";
import { listJobPhotosFull } from "@/lib/server/store";

/** Download the debrief as a single self-contained file to hand in as assessment evidence. */
export const GET = route(async (_request: Request, ctx: RouteContext<"/api/jobs/[id]/export">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await loadJob(id, user.id);
  if (job.state.phase !== "complete") {
    throw new HttpError(409, "The scorecard is ready once the build is handed over.");
  }
  const photos = await listJobPhotosFull(user.id, job.id);
  const html = renderEvidence({
    student: user.name,
    email: user.email,
    title: job.title,
    state: job.state,
    card: buildScorecard(job.state),
    photos: photos.filter((photo) => photo.status === "complete"),
  });
  const safeName = user.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "student";
  const date = (job.state.completedAt ?? job.updatedAt).slice(0, 10);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="foreman-debrief-${safeName}-${date}.html"`,
      "Cache-Control": "no-store",
    },
  });
});
