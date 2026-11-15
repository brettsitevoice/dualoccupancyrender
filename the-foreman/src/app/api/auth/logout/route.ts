import { endSession } from "@/lib/server/auth";
import { checkOrigin, json, route } from "@/lib/server/http";

export const POST = route(async (request: Request) => {
  checkOrigin(request);
  await endSession();
  return json({ ok: true });
});
