import { hashPassword, startSession, verifyPassword } from "@/lib/server/auth";
import { checkOrigin, clientIp, HttpError, isHttps, json, readJson, route, str } from "@/lib/server/http";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { findUserByEmail } from "@/lib/server/store";

// Checked when the email isn't registered, so a wrong email takes as long to
// reject as a wrong password.
let dummyHash: Promise<string> | null = null;

export const POST = route(async (request: Request) => {
  checkOrigin(request);
  const body = await readJson(request);
  const email = str(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) throw new HttpError(400, "Enter your email and password.");

  if (!allow(`login:${clientIp(request)}:${email}`, LIMITS.login)) {
    throw new HttpError(429, "Too many tries. Wait a few minutes and try again.");
  }

  const user = await findUserByEmail(email);
  dummyHash ??= hashPassword("not-a-real-password");
  const matches = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !matches) throw new HttpError(401, "That email or password isn't right.");

  await startSession(user, isHttps(request));
  return json({ user: { id: user.id, name: user.name, email: user.email } });
});
