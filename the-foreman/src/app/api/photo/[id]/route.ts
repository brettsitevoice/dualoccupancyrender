import { HttpError, json, requireUser, route } from "@/lib/server/http";
import { photoView } from "@/lib/server/jobs";
import { getPhoto } from "@/lib/server/store";

export const GET = route(async (_request: Request, ctx: RouteContext<"/api/photo/[id]">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const photo = await getPhoto(id, user.id);
  if (!photo) throw new HttpError(404, "Couldn't find that photo check.");
  return json({ review: photoView(photo, true) });
});
