import "server-only";

import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";

// SQLite to start with: a local file by default (zero setup), or a hosted
// libSQL/Turso database when DATABASE_URL points at one. All SQL in the app
// goes through src/lib/server/store.ts, so moving to another database later
// means rewriting that one file.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS jobs (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     status TEXT NOT NULL,
     title TEXT NOT NULL,
     state TEXT NOT NULL,
     version INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS jobs_user ON jobs (user_id, updated_at)`,
  `CREATE TABLE IF NOT EXISTS photo_reviews (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     job_id TEXT,
     task TEXT NOT NULL,
     note TEXT NOT NULL DEFAULT '',
     image TEXT NOT NULL,
     thumb TEXT NOT NULL DEFAULT '',
     observations TEXT NOT NULL DEFAULT '',
     reasoning TEXT NOT NULL DEFAULT '',
     feedback TEXT NOT NULL DEFAULT '',
     status TEXT NOT NULL,
     ai INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS photo_reviews_user ON photo_reviews (user_id, created_at)`,
];

interface Handle {
  client: Client;
  ready: Promise<void>;
}

// Keep one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __foremanDb?: Handle };

function open(): Handle {
  const url = process.env.DATABASE_URL || "file:./data/foreman.db";
  if (url.startsWith("file:")) {
    const file = url.slice("file:".length).replace(/^\/\/(?=\/)/, "");
    mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const ready = client.batch(SCHEMA, "write").then(() => undefined);
  ready.catch(() => {
    // Let the next request try again rather than caching a failed start-up.
    globalForDb.__foremanDb = undefined;
  });
  return { client, ready };
}

export async function getDb(): Promise<Client> {
  if (!globalForDb.__foremanDb) globalForDb.__foremanDb = open();
  const handle = globalForDb.__foremanDb;
  await handle.ready;
  return handle.client;
}
