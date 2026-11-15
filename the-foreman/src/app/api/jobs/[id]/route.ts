import { json, requireUser, route } from "@/lib/server/http";
import { loadJob, viewOf } from "@/lib/server/jobs";

export const GET = route(async (_request: Request, ctx: RouteContext<"/api/jobs/[id]">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await loadJob(id, user.id);
  return json({ view: viewOf(job) });
});
