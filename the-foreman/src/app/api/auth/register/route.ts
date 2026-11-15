import { hashPassword, startSession } from "@/lib/server/auth";
import { checkOrigin, clientIp, HttpError, isHttps, json, readJson, route, str } from "@/lib/server/http";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { createUser } from "@/lib/server/store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = route(async (request: Request) => {
  checkOrigin(request);
  if (!allow(`register:${clientIp(request)}`, LIMITS.register)) {
    throw new HttpError(429, "Too many sign-ups from here. Try again later.");
  }

  const body = await readJson(request);
  const name = str(body.name, 60);
  const email = str(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const classCode = str(body.classCode, 60);

  if (!name) throw new HttpError(400, "Enter your name.");
  if (!EMAIL.test(email)) throw new HttpError(400, "Enter a valid email address.");
  if (password.length < 8) throw new HttpError(400, "Use a password with at least 8 characters.");
  if (password.length > 200) throw new HttpError(400, "That password is too long.");

  const required = process.env.SIGNUP_CODE?.trim();
  if (required && classCode.toLowerCase() !== required.toLowerCase()) {
    throw new HttpError(403, "That class code isn't right. Check it with your teacher.");
  }

  const user = await createUser({ name, email, passwordHash: await hashPassword(password) });
  if (!user) throw new HttpError(409, "That email is already registered. Sign in instead.");

  await startSession(user, isHttps(request));
  return json({ user: { id: user.id, name: user.name, email: user.email } }, 201);
});
