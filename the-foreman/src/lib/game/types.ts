// Shared game types. This file is safe to import from both server and client code:
// it holds shapes only, never scenario answers.

export const STAGE_IDS = [
  "setout",
  "footings",
  "slab",
  "frame",
  "roof",
  "lockup",
  "fitoff",
  "handover",
] as const;

export type StageId = (typeof STAGE_IDS)[number];

export type Quality = "good" | "partial" | "poor";

export type SoilClass = "A" | "S" | "M" | "H1" | "H2" | "P";
export type WindClass = "N1" | "N2" | "N3";
export type Bal = "BAL-LOW" | "BAL-12.5" | "BAL-19" | "BAL-29";
export type RoofType = "concrete tile" | "metal sheet";
export type Season = "summer" | "autumn" | "winter" | "spring";
export type BuildLength = "quick" | "full";

/** A generated virtual building site. All dimensions are metric. */
export interface Site {
  seed: number;
  lot: string;
  street: string;
  suburb: string;
  region: string;
  /** Lot width and depth in metres. */
  lotWidth: number;
  lotDepth: number;
  /** Fall across the building platform in metres. */
  fall: number;
  fallDirection: string;
  soilClass: SoilClass;
  soilNote: string;
  windClass: WindClass;
  bal: Bal;
  climateZone: number;
  /** Distance to a surf coast in kilometres, or null when well inland. */
  coastKm: number | null;
  /** House floor area in square metres. */
  houseArea: number;
  bedrooms: number;
  roof: RoofType;
  roofPitch: number;
  startMonth: string;
  startSeason: Season;
  /** Planned cost of the build in AUD, before contingency. */
  baselineCost: number;
  /** Planned duration in working days, before float. */
  baselineDays: number;
}

/** One answered decision, stored in the job ledger. */
export interface LedgerEntry {
  decisionId: string;
  stage: StageId;
  kind: "core" | "site" | "event";
  title: string;
  mode: "tap" | "voice" | "text";
  /** The option tapped, or the option the foreman judged closest to a spoken answer. */
  optionId: string | null;
  /** What the student chose or said. */
  answer: string;
  quality: Quality;
  cost: number;
  days: number;
  inspectionFail: boolean;
  safety: boolean;
  /** What happened on site as a result. */
  outcome: string;
  /** The foreman's explanation (AI where available, otherwise the authored note). */
  feedback: string;
  aiFeedback: boolean;
  units: string[];
  at: string;
}

export type Phase =
  | "brief"
  | "stage_intro"
  | "decision"
  | "feedback"
  | "stage_done"
  | "complete";

export interface Debrief {
  text: string;
  ai: boolean;
}

/** The full saved state of a job. Stored as JSON in the database. */
export interface GameState {
  v: 1;
  seed: number;
  length: BuildLength | null;
  site: Site;
  /** Decision ids for each stage, in the order they are played. Empty until the job starts. */
  plan: Partial<Record<StageId, string[]>>;
  stageIdx: number;
  itemIdx: number;
  phase: Phase;
  ledger: LedgerEntry[];
  /** Planned contingency (AUD) and float (days) for this job. */
  contingency: number;
  floatDays: number;
  briefings: Partial<Record<StageId, Debrief>>;
  debrief: Debrief | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Client-safe views. Nothing in here reveals which option is correct before
// the student has answered.
// ---------------------------------------------------------------------------

export interface StageView {
  id: StageId;
  n: number;
  name: string;
  blurb: string;
  status: "done" | "current" | "todo";
}

export interface HudView {
  budget: number;
  contingency: number;
  extraCost: number;
  /** Positive when over budget. */
  costOver: number;
  programDays: number;
  floatDays: number;
  extraDays: number;
  /** Positive when behind program. */
  daysOver: number;
  dayNow: number;
  failedInspections: number;
  safetyBreaches: number;
  answered: number;
  total: number;
}

export interface DecisionView {
  id: string;
  kind: "core" | "site" | "event";
  title: string;
  situation: string;
  question: string;
  options: { id: string; label: string }[];
  /** Position within the stage, 1-based. */
  n: number;
  of: number;
}

export interface ResultView {
  decisionId: string;
  kind: "core" | "site" | "event";
  title: string;
  situation: string;
  question: string;
  mode: "tap" | "voice" | "text";
  answer: string;
  quality: Quality;
  cost: number;
  days: number;
  inspectionFail: boolean;
  safety: boolean;
  outcome: string;
  feedback: string;
  aiFeedback: boolean;
  /** The best call, shown once the student has answered. */
  bestCall: string;
  refs: string[];
  n: number;
  of: number;
}

export interface StageSummaryView {
  stage: StageView;
  items: { title: string; quality: Quality; cost: number; days: number }[];
  inspection: { name: string; passed: boolean } | null;
  cost: number;
  days: number;
  isLast: boolean;
}

export interface BriefingView {
  /** Saved briefing text, if one has already been generated for this stage. */
  text: string | null;
  focus: string[];
}

export interface GameView {
  id: string;
  phase: Phase;
  length: BuildLength | null;
  site: Site;
  stages: StageView[];
  stage: StageView | null;
  hud: HudView;
  decision: DecisionView | null;
  result: ResultView | null;
  briefing: BriefingView | null;
  stageSummary: StageSummaryView | null;
  aiEnabled: boolean;
  updatedAt: string;
}

export interface UnitEvidence {
  code: string;
  title: string;
  elective: boolean;
  decisions: number;
  /** Points earned: good = 1, partly right = 0.5. */
  points: number;
  items: { title: string; stage: string; quality: Quality }[];
}

export interface Scorecard {
  cost: { score: number; budget: number; finalCost: number; over: number; extra: number; contingency: number };
  time: { score: number; programDays: number; finalDays: number; over: number; extra: number; floatDays: number };
  compliance: {
    score: number;
    failedInspections: number;
    safetyBreaches: number;
    otherPoor: number;
    partial: number;
  };
  decisions: { score: number; good: number; partial: number; poor: number; total: number; ownWords: number };
  overall: number;
  rating: { label: string; note: string };
  units: UnitEvidence[];
  stages: {
    id: StageId;
    name: string;
    items: LedgerEntry[];
  }[];
}

export interface JobSummary {
  id: string;
  title: string;
  status: "active" | "complete";
  stageName: string | null;
  stageN: number;
  overall: number | null;
  updatedAt: string;
  createdAt: string;
}

export interface PhotoReviewView {
  id: string;
  jobId: string | null;
  task: string;
  note: string;
  image: string; // data URL
  observations: string;
  reasoning: string;
  feedback: string;
  status: "awaiting_reasoning" | "complete";
  aiEnabled: boolean;
  createdAt: string;
}
