import { json, requireUser, route } from "@/lib/server/http";

export const GET = route(async () => {
  const user = await requireUser();
  return json({ user });
});
