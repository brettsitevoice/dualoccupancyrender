import "server-only";

import { randomBytes } from "node:crypto";
import type { GameState } from "@/lib/game/types";
import { getDb } from "./db";

// Every database query in the app lives in this file.

export function newId(): string {
  return randomBytes(9).toString("base64url");
}

// ---------------------------------------------------------------------------
// Users and sessions
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

function toUser(row: Record<string, unknown>): UserRow {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    passwordHash: String(row.password_hash),
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

/** Returns null when the email is already registered. */
export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRow | null> {
  const db = await getDb();
  const id = newId();
  const result = await db.execute({
    sql: `INSERT INTO users (id, email, name, password_hash, created_at)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT (email) DO NOTHING`,
    args: [id, input.email, input.name, input.passwordHash, new Date().toISOString()],
  });
  if (result.rowsAffected === 0) return null;
  return { id, ...input };
}

export async function insertSession(id: string, userId: string, expiresAt: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [id, userId, expiresAt, new Date().toISOString()],
  });
}

export async function findSessionUser(id: string, now: number): Promise<UserRow | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
          WHERE sessions.id = ? AND sessions.expires_at > ?`,
    args: [id, now],
  });
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
}

export async function deleteExpiredSessions(now: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM sessions WHERE expires_at <= ?", args: [now] });
}

// ---------------------------------------------------------------------------
// Jobs (a job is one virtual build)
// ---------------------------------------------------------------------------

export interface JobRow {
  id: string;
  userId: string;
  status: "active" | "complete";
  title: string;
  state: GameState;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function toJob(row: Record<string, unknown>): JobRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    status: row.status === "complete" ? "complete" : "active",
    title: String(row.title),
    state: JSON.parse(String(row.state)) as GameState,
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createJob(userId: string, title: string, state: GameState): Promise<JobRow> {
  const db = await getDb();
  const id = newId();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO jobs (id, user_id, status, title, state, version, created_at, updated_at)
          VALUES (?, ?, 'active', ?, ?, 1, ?, ?)`,
    args: [id, userId, title, JSON.stringify(state), now, now],
  });
  return { id, userId, status: "active", title, state, version: 1, createdAt: now, updatedAt: now };
}

/** Only ever returns a job that belongs to the given user. */
export async function getJob(id: string, userId: string): Promise<JobRow | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM jobs WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  return result.rows[0] ? toJob(result.rows[0]) : null;
}

export async function listJobs(userId: string): Promise<JobRow[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM jobs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50",
    args: [userId],
  });
  return result.rows.map(toJob);
}

export async function countActiveJobs(userId: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT count(*) AS n FROM jobs WHERE user_id = ? AND status = 'active'",
    args: [userId],
  });
  return Number(result.rows[0]?.n ?? 0);
}

/**
 * Save a job only if nobody else has saved it since it was read
 * (optimistic locking on the version number). Returns the updated row, or
 * null when the job changed underneath us.
 */
export async function saveJob(job: JobRow, state: GameState): Promise<JobRow | null> {
  const db = await getDb();
  const now = new Date().toISOString();
  const status = state.phase === "complete" ? "complete" : "active";
  const result = await db.execute({
    sql: `UPDATE jobs SET state = ?, status = ?, version = version + 1, updated_at = ?
          WHERE id = ? AND user_id = ? AND version = ?`,
    args: [JSON.stringify(state), status, now, job.id, job.userId, job.version],
  });
  if (result.rowsAffected === 0) return null;
  return { ...job, state, status, version: job.version + 1, updatedAt: now };
}

// ---------------------------------------------------------------------------
// Workshop photo reviews
// ---------------------------------------------------------------------------

export interface PhotoRow {
  id: string;
  userId: string;
  jobId: string | null;
  task: string;
  note: string;
  /** JPEG as base64 (no data: prefix), downscaled in the browser before upload. */
  image: string;
  /** Small JPEG preview as base64. */
  thumb: string;
  observations: string;
  reasoning: string;
  feedback: string;
  status: "awaiting_reasoning" | "complete";
  ai: boolean;
  createdAt: string;
  updatedAt: string;
}

function toPhoto(row: Record<string, unknown>): PhotoRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    jobId: row.job_id === null ? null : String(row.job_id),
    task: String(row.task),
    note: String(row.note),
    image: String(row.image),
    thumb: String(row.thumb),
    observations: String(row.observations),
    reasoning: String(row.reasoning),
    feedback: String(row.feedback),
    status: row.status === "complete" ? "complete" : "awaiting_reasoning",
    ai: Number(row.ai) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createPhoto(input: {
  userId: string;
  jobId: string | null;
  task: string;
  note: string;
  image: string;
  thumb: string;
}): Promise<PhotoRow> {
  const db = await getDb();
  const id = newId();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO photo_reviews
            (id, user_id, job_id, task, note, image, thumb, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'awaiting_reasoning', ?, ?)`,
    args: [id, input.userId, input.jobId, input.task, input.note, input.image, input.thumb, now, now],
  });
  return {
    id,
    ...input,
    observations: "",
    reasoning: "",
    feedback: "",
    status: "awaiting_reasoning",
    ai: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getPhoto(id: string, userId: string): Promise<PhotoRow | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM photo_reviews WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  return result.rows[0] ? toPhoto(result.rows[0]) : null;
}

const PHOTO_LIST_COLUMNS =
  "id, user_id, job_id, task, note, '' AS image, thumb, observations, reasoning, feedback, status, ai, created_at, updated_at";

/** Lists photo reviews without the full-size image (use getPhoto for that). */
export async function listPhotos(userId: string, jobId?: string): Promise<PhotoRow[]> {
  const db = await getDb();
  const result = jobId
    ? await db.execute({
        sql: `SELECT ${PHOTO_LIST_COLUMNS} FROM photo_reviews
              WHERE user_id = ? AND job_id = ? ORDER BY created_at DESC LIMIT 30`,
        args: [userId, jobId],
      })
    : await db.execute({
        sql: `SELECT ${PHOTO_LIST_COLUMNS} FROM photo_reviews
              WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
        args: [userId],
      });
  return result.rows.map(toPhoto);
}

/** Full photo reviews (with images) linked to a job, for the evidence export. */
export async function listJobPhotosFull(userId: string, jobId: string): Promise<PhotoRow[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM photo_reviews WHERE user_id = ? AND job_id = ? ORDER BY created_at ASC LIMIT 12",
    args: [userId, jobId],
  });
  return result.rows.map(toPhoto);
}

export async function updatePhoto(
  id: string,
  userId: string,
  patch: Partial<Pick<PhotoRow, "observations" | "reasoning" | "feedback" | "status" | "ai">>,
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (patch.observations !== undefined) {
    sets.push("observations = ?");
    args.push(patch.observations);
  }
  if (patch.reasoning !== undefined) {
    sets.push("reasoning = ?");
    args.push(patch.reasoning);
  }
  if (patch.feedback !== undefined) {
    sets.push("feedback = ?");
    args.push(patch.feedback);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    args.push(patch.status);
  }
  if (patch.ai !== undefined) {
    sets.push("ai = ?");
    args.push(patch.ai ? 1 : 0);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  args.push(new Date().toISOString(), id, userId);
  await db.execute({
    sql: `UPDATE photo_reviews SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  });
}
