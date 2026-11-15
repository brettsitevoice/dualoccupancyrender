import { randomInt } from "node:crypto";
import { aiEnabled } from "@/lib/ai/foreman";
import { newGame } from "@/lib/game/engine";
import { siteTitle } from "@/lib/game/site";
import { checkOrigin, HttpError, json, requireUser, route } from "@/lib/server/http";
import { summaryOf } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { countActiveJobs, createJob, listJobs } from "@/lib/server/store";

const MAX_ACTIVE_JOBS = 10;

/** The signed-in student's jobs, newest first. */
export const GET = route(async () => {
  const user = await requireUser();
  const jobs = await listJobs(user.id);
  return json({ user, jobs: jobs.map(summaryOf), aiEnabled: aiEnabled() });
});

/** Start a new job on a freshly generated site. */
export const POST = route(async (request: Request) => {
  checkOrigin(request);
  const user = await requireUser();
  if (!allow(`newjob:${user.id}`, LIMITS.newJob)) {
    throw new HttpError(429, "That's a lot of new builds. Finish one of your current jobs first.");
  }
  if ((await countActiveJobs(user.id)) >= MAX_ACTIVE_JOBS) {
    throw new HttpError(409, "You've got plenty of jobs on the go. Finish one before starting another.");
  }
  const state = newGame(randomInt(1, 2_147_483_647), new Date().toISOString());
  const job = await createJob(user.id, siteTitle(state.site), state);
  return json({ id: job.id }, 201);
});
