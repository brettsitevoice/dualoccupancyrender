import "server-only";

import { aiEnabled } from "@/lib/ai/foreman";
import { toView } from "@/lib/game/engine";
import { buildScorecard } from "@/lib/game/scorecard";
import { STAGES } from "@/lib/game/stages";
import type { GameState, GameView, JobSummary, PhotoReviewView } from "@/lib/game/types";
import { HttpError } from "./http";
import { getJob, saveJob, type JobRow, type PhotoRow } from "./store";

export async function loadJob(id: string, userId: string): Promise<JobRow> {
  const job = await getJob(id, userId);
  if (!job) throw new HttpError(404, "Couldn't find that job.");
  return job;
}

/** Save the job, or fail cleanly if it changed since it was loaded (e.g. a double tap). */
export async function persist(job: JobRow, state: GameState): Promise<JobRow> {
  const saved = await saveJob(job, state);
  if (!saved) throw new HttpError(409, "This job changed somewhere else. Reloading it.", "stale");
  return saved;
}

export function viewOf(job: JobRow): GameView {
  return toView(job.id, job.state, job.updatedAt, aiEnabled());
}

export function summaryOf(job: JobRow): JobSummary {
  const state = job.state;
  const started = state.phase !== "brief";
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    stageName: started ? STAGES[state.stageIdx].name : null,
    stageN: started ? state.stageIdx + 1 : 0,
    overall: state.phase === "complete" ? buildScorecard(state).overall : null,
    updatedAt: job.updatedAt,
    createdAt: job.createdAt,
  };
}

export function photoView(row: PhotoRow, withImage: boolean): PhotoReviewView {
  return {
    id: row.id,
    jobId: row.jobId,
    task: row.task,
    note: row.note,
    image: `data:image/jpeg;base64,${withImage && row.image ? row.image : row.thumb}`,
    observations: row.observations,
    reasoning: row.reasoning,
    feedback: row.feedback,
    status: row.status,
    aiEnabled: aiEnabled(),
    createdAt: row.createdAt,
  };
}
