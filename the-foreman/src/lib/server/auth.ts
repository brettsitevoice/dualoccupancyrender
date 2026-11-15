import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { promisify } from "node:util";
import {
  deleteExpiredSessions,
  deleteSession,
  findSessionUser,
  insertSession,
  type UserRow,
} from "./store";

// Simple email-and-password login with database-backed sessions.
// - Passwords are hashed with scrypt and a per-user salt.
// - The browser holds a random session token in an HTTP-only cookie; the
//   database stores only a hash of it.

export const SESSION_COOKIE = "foreman_session";
const SESSION_DAYS = 30;
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sessionId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Start a session for the user and set the cookie on the response.
 * `secure` marks the cookie HTTPS-only. It follows how the request arrived,
 * so the app still works over plain HTTP on a local network during testing.
 */
export async function startSession(user: UserRow, secure: boolean): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await insertSession(sessionId(token), user.id, expiresAt);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  // Housekeeping: clear out old sessions now and then.
  if (Math.random() < 0.05) void deleteExpiredSessions(Date.now()).catch(() => undefined);
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(sessionId(token));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in student for this request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await findSessionUser(sessionId(token), Date.now());
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}
