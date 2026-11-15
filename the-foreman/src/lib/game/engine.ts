// The game engine. Pure functions only: no database, no network, no clock
// other than timestamps passed in. Everything that decides cost, time and
// compliance lives here, on the server, so a browser can't talk its way to a
// better result.

import { makeRng, shuffle, weightedPick } from "./rng";
import { ALL_DECISIONS, DECISION_BY_ID, type DecisionDef, type OptionDef } from "./scenarios";
import { contingencyFor, FLOAT_DAYS, generateSite, stageDays } from "./site";
import { STAGES } from "./stages";
import type {
  BuildLength,
  DecisionView,
  GameState,
  GameView,
  HudView,
  LedgerEntry,
  Quality,
  ResultView,
  Site,
  StageId,
  StageSummaryView,
  StageView,
} from "./types";

const PER_STAGE: Record<BuildLength, number> = { quick: 2, full: 3 };
const EVENTS: Record<BuildLength, number> = { quick: 2, full: 4 };

export class GameError extends Error {
  constructor(
    public code: "bad_phase" | "bad_option" | "not_found" | "bad_input",
    message: string,
  ) {
    super(message);
  }
}

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function text(value: string | ((site: Site) => string), site: Site): string {
  return typeof value === "function" ? value(site) : value;
}

// ---------------------------------------------------------------------------
// Creating and starting a job
// ---------------------------------------------------------------------------

export function newGame(seed: number, now: string): GameState {
  const site = generateSite(seed);
  return {
    v: 1,
    seed,
    length: null,
    site,
    plan: {},
    stageIdx: 0,
    itemIdx: 0,
    phase: "brief",
    ledger: [],
    contingency: contingencyFor(site),
    floatDays: FLOAT_DAYS,
    briefings: {},
    debrief: null,
    createdAt: now,
    startedAt: null,
    completedAt: null,
  };
}

/** Choose which decisions and site events this job will throw at the student. */
export function buildPlan(site: Site, seed: number, length: BuildLength): Record<StageId, string[]> {
  const rng = makeRng((seed ^ 0x9e3779b9) >>> 0);
  const applicable = ALL_DECISIONS.filter((decision) => !decision.when || decision.when(site));

  // Random site events: weighted draw, never more than one per stage.
  const events: DecisionDef[] = [];
  let eventPool = applicable.filter((decision) => decision.kind === "event");
  while (events.length < EVENTS[length] && eventPool.length > 0) {
    const event = weightedPick(rng, eventPool, (decision) => decision.weight ?? 1);
    events.push(event);
    eventPool = eventPool.filter((decision) => decision.stage !== event.stage);
  }
  const excluded = new Set(events.flatMap((event) => event.excludes ?? []));

  const plan = {} as Record<StageId, string[]>;
  for (const stage of STAGES) {
    const inStage = applicable.filter(
      (decision) => decision.stage === stage.id && !excluded.has(decision.id),
    );
    const siteSpecific = shuffle(
      rng,
      inStage.filter((decision) => decision.kind === "site"),
    );
    const core = shuffle(
      rng,
      inStage.filter((decision) => decision.kind === "core"),
    );

    // Lead with one decision that only exists because of this site's conditions.
    const picks: DecisionDef[] = siteSpecific.slice(0, 1);
    for (const candidate of core) {
      if (picks.length >= PER_STAGE[length]) break;
      const clash = picks.some(
        (pick) => pick.excludes?.includes(candidate.id) || candidate.excludes?.includes(pick.id),
      );
      if (!clash) picks.push(candidate);
    }

    plan[stage.id] = [...picks, ...events.filter((event) => event.stage === stage.id)]
      .sort((a, b) => a.order - b.order)
      .map((decision) => decision.id);
  }
  return plan;
}

export function startGame(state: GameState, length: BuildLength, now: string): GameState {
  if (state.phase !== "brief") throw new GameError("bad_phase", "This job has already started.");
  return {
    ...state,
    length,
    plan: buildPlan(state.site, state.seed, length),
    stageIdx: 0,
    itemIdx: 0,
    phase: "stage_intro",
    startedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Reading the current position
// ---------------------------------------------------------------------------

function stageItems(state: GameState, stageIdx: number): string[] {
  const ids = state.plan[STAGES[stageIdx].id] ?? [];
  // Ignore ids that no longer exist in the scenario bank (e.g. after an update).
  return ids.filter((id) => DECISION_BY_ID.has(id));
}

export function currentDecision(state: GameState): DecisionDef | null {
  if (state.phase !== "decision" && state.phase !== "feedback") return null;
  const id = stageItems(state, state.stageIdx)[state.itemIdx];
  return id ? (DECISION_BY_ID.get(id) ?? null) : null;
}

/** Options in the order this job shows them. Shuffled per job so the best call isn't always first. */
export function shownOptions(state: GameState, decision: DecisionDef): OptionDef[] {
  const rng = makeRng((state.seed + hashString(decision.id)) >>> 0);
  return shuffle(rng, decision.options);
}

export function describeDecision(
  state: GameState,
  decision: DecisionDef,
): { situation: string; question: string } {
  return { situation: text(decision.situation, state.site), question: decision.question };
}

function totalItems(state: GameState): number {
  return STAGES.reduce((sum, _stage, idx) => sum + stageItems(state, idx).length, 0);
}

export function totals(state: GameState) {
  const extraCost = state.ledger.reduce((sum, entry) => sum + entry.cost, 0);
  const extraDays = state.ledger.reduce((sum, entry) => sum + entry.days, 0);
  return {
    extraCost,
    extraDays,
    failedInspections: state.ledger.filter((entry) => entry.inspectionFail).length,
    safetyBreaches: state.ledger.filter((entry) => entry.safety).length,
    budget: state.site.baselineCost + state.contingency,
    programDays: state.site.baselineDays + state.floatDays,
  };
}

// ---------------------------------------------------------------------------
// Answering
// ---------------------------------------------------------------------------

export interface ResolvedOutcome {
  optionId: string | null;
  quality: Quality;
  cost: number;
  days: number;
  inspectionFail: boolean;
  safety: boolean;
  outcome: string;
}

function fromOption(option: OptionDef): ResolvedOutcome {
  return {
    optionId: option.id,
    quality: option.quality,
    cost: option.cost,
    days: option.days,
    inspectionFail: Boolean(option.inspectionFail),
    safety: Boolean(option.safety),
    outcome: option.outcome,
  };
}

export function resolveTap(decision: DecisionDef, optionId: string): ResolvedOutcome {
  const option = decision.options.find((candidate) => candidate.id === optionId);
  if (!option) throw new GameError("bad_option", "That option isn't part of this decision.");
  return fromOption(option);
}

const GENERIC_OUTCOME: Record<Quality, string> = {
  good: "The right call. The job kept moving.",
  partial: "Right direction, but the gaps meant some rework on site.",
  poor: "That call cost the job rework and time.",
};

/**
 * Turn the foreman's verdict on an answer given in the student's own words
 * into consequences. The verdict comes from the AI; the dollars and days
 * always come from the authored options, so the model can't invent penalties.
 */
export function resolveSpoken(
  decision: DecisionDef,
  verdict: Quality,
  closestId: string | null,
): ResolvedOutcome {
  const closest = decision.options.find((option) => option.id === closestId) ?? null;
  if (closest && closest.quality === verdict) return fromOption(closest);

  const sameQuality = decision.options.find((option) => option.quality === verdict);
  if (sameQuality) {
    // Use the authored cost and time for this quality of answer, but not its
    // story, which describes a different specific choice.
    return { ...fromOption(sameQuality), optionId: closest?.id ?? null, outcome: GENERIC_OUTCOME[verdict] };
  }

  if (verdict === "good") {
    return {
      optionId: closest?.id ?? null,
      quality: "good",
      cost: 0,
      days: 0,
      inspectionFail: false,
      safety: false,
      outcome: GENERIC_OUTCOME.good,
    };
  }

  // No authored option of this quality: scale from the worst option.
  const worst = decision.options.reduce((a, b) => (b.cost > a.cost ? b : a));
  const factor = verdict === "partial" ? 0.3 : 1;
  return {
    optionId: closest?.id ?? null,
    quality: verdict,
    cost: Math.round((worst.cost * factor) / 100) * 100,
    days: Math.ceil(worst.days * factor),
    inspectionFail: verdict === "poor" && Boolean(worst.inspectionFail),
    safety: verdict === "poor" && Boolean(worst.safety),
    outcome: GENERIC_OUTCOME[verdict],
  };
}

export interface AnswerInput {
  mode: "tap" | "voice" | "text";
  /** The words to record: the option label for a tap, or what the student said. */
  answer: string;
  resolved: ResolvedOutcome;
  feedback: string;
  aiFeedback: boolean;
}

export function applyAnswer(state: GameState, input: AnswerInput, now: string): GameState {
  if (state.phase !== "decision") {
    throw new GameError("bad_phase", "There's no decision waiting for an answer.");
  }
  const decision = currentDecision(state);
  if (!decision) throw new GameError("not_found", "Couldn't find the current decision.");

  const entry: LedgerEntry = {
    decisionId: decision.id,
    stage: decision.stage,
    kind: decision.kind,
    title: decision.title,
    mode: input.mode,
    optionId: input.resolved.optionId,
    answer: input.answer,
    quality: input.resolved.quality,
    cost: input.resolved.cost,
    days: input.resolved.days,
    inspectionFail: input.resolved.inspectionFail,
    safety: input.resolved.safety,
    outcome: input.resolved.outcome,
    feedback: input.feedback || decision.why,
    aiFeedback: input.aiFeedback && Boolean(input.feedback),
    units: decision.units,
    at: now,
  };
  return { ...state, ledger: [...state.ledger, entry], phase: "feedback" };
}

/** Replace the foreman's feedback on the most recent answer (once the AI has finished). */
export function setLastFeedback(state: GameState, decisionId: string, feedback: string): GameState {
  const last = state.ledger[state.ledger.length - 1];
  if (!last || last.decisionId !== decisionId || !feedback) return state;
  const ledger = state.ledger.slice();
  ledger[ledger.length - 1] = { ...last, feedback, aiFeedback: true };
  return { ...state, ledger };
}

// ---------------------------------------------------------------------------
// Moving on
// ---------------------------------------------------------------------------

export function advance(state: GameState, now: string): GameState {
  switch (state.phase) {
    case "brief":
      throw new GameError("bad_phase", "Choose a build length to start the job.");
    case "decision":
      throw new GameError("bad_phase", "Answer the decision before moving on.");
    case "complete":
      return state;
    case "stage_intro": {
      const items = stageItems(state, state.stageIdx);
      if (items.length === 0) return { ...state, phase: "stage_done" };
      return { ...state, phase: "decision", itemIdx: 0 };
    }
    case "feedback": {
      const items = stageItems(state, state.stageIdx);
      if (state.itemIdx + 1 < items.length) {
        return { ...state, phase: "decision", itemIdx: state.itemIdx + 1 };
      }
      return { ...state, phase: "stage_done" };
    }
    case "stage_done": {
      if (state.stageIdx + 1 < STAGES.length) {
        return { ...state, phase: "stage_intro", stageIdx: state.stageIdx + 1, itemIdx: 0 };
      }
      return { ...state, phase: "complete", completedAt: now };
    }
  }
}

// ---------------------------------------------------------------------------
// Views for the browser. Nothing here exposes an unanswered option's rating.
// ---------------------------------------------------------------------------

function stageViews(state: GameState): StageView[] {
  const started = state.phase !== "brief";
  return STAGES.map((stage, idx) => ({
    id: stage.id,
    n: stage.n,
    name: stage.name,
    blurb: stage.blurb,
    status:
      state.phase === "complete" || (started && idx < state.stageIdx)
        ? "done"
        : started && idx === state.stageIdx
          ? state.phase === "stage_done"
            ? "done"
            : "current"
          : "todo",
  }));
}

export function hud(state: GameState): HudView {
  const sums = totals(state);
  const days = stageDays(state.site);
  let dayNow = 0;
  if (state.phase !== "brief") {
    for (let idx = 0; idx < state.stageIdx; idx++) dayNow += days[idx];
    const items = stageItems(state, state.stageIdx).length;
    const doneInStage =
      state.phase === "stage_done" || state.phase === "complete"
        ? 1
        : items === 0
          ? 0
          : (state.itemIdx + (state.phase === "feedback" ? 1 : 0)) / items;
    dayNow += Math.round(days[state.stageIdx] * doneInStage);
    if (state.phase === "complete") dayNow = state.site.baselineDays;
  }
  return {
    budget: sums.budget,
    contingency: state.contingency,
    extraCost: sums.extraCost,
    costOver: sums.extraCost - state.contingency,
    programDays: sums.programDays,
    floatDays: state.floatDays,
    extraDays: sums.extraDays,
    daysOver: sums.extraDays - state.floatDays,
    dayNow: Math.max(1, dayNow + sums.extraDays),
    failedInspections: sums.failedInspections,
    safetyBreaches: sums.safetyBreaches,
    answered: state.ledger.length,
    total: totalItems(state),
  };
}

function decisionView(state: GameState, decision: DecisionDef): DecisionView {
  const words = describeDecision(state, decision);
  return {
    id: decision.id,
    kind: decision.kind,
    title: decision.title,
    situation: words.situation,
    question: words.question,
    options: shownOptions(state, decision).map((option) => ({ id: option.id, label: option.label })),
    n: state.itemIdx + 1,
    of: stageItems(state, state.stageIdx).length,
  };
}

function resultView(state: GameState, decision: DecisionDef, entry: LedgerEntry): ResultView {
  const words = describeDecision(state, decision);
  const best = decision.options.find((option) => option.quality === "good");
  return {
    decisionId: decision.id,
    kind: decision.kind,
    title: decision.title,
    situation: words.situation,
    question: words.question,
    mode: entry.mode,
    answer: entry.answer,
    quality: entry.quality,
    cost: entry.cost,
    days: entry.days,
    inspectionFail: entry.inspectionFail,
    safety: entry.safety,
    outcome: entry.outcome,
    feedback: entry.feedback,
    aiFeedback: entry.aiFeedback,
    bestCall: best?.label ?? "",
    refs: decision.refs,
    n: state.itemIdx + 1,
    of: stageItems(state, state.stageIdx).length,
  };
}

function stageSummary(state: GameState, stages: StageView[]): StageSummaryView {
  const stage = STAGES[state.stageIdx];
  const entries = state.ledger.filter((entry) => entry.stage === stage.id);
  return {
    stage: stages[state.stageIdx],
    items: entries.map((entry) => ({
      title: entry.title,
      quality: entry.quality,
      cost: entry.cost,
      days: entry.days,
    })),
    inspection: stage.inspection
      ? { name: stage.inspection, passed: !entries.some((entry) => entry.inspectionFail) }
      : null,
    cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
    days: entries.reduce((sum, entry) => sum + entry.days, 0),
    isLast: state.stageIdx === STAGES.length - 1,
  };
}

export function toView(id: string, state: GameState, updatedAt: string, aiEnabled: boolean): GameView {
  const stages = stageViews(state);
  const stage = state.phase === "brief" ? null : stages[state.stageIdx];
  const decision = currentDecision(state);
  const lastEntry = state.ledger[state.ledger.length - 1];
  const stageDef = STAGES[state.stageIdx];

  return {
    id,
    phase: state.phase,
    length: state.length,
    site: state.site,
    stages,
    stage,
    hud: hud(state),
    decision: state.phase === "decision" && decision ? decisionView(state, decision) : null,
    result:
      state.phase === "feedback" && decision && lastEntry?.decisionId === decision.id
        ? resultView(state, decision, lastEntry)
        : null,
    briefing:
      state.phase === "stage_intro"
        ? { text: state.briefings[stageDef.id]?.text ?? null, focus: stageDef.focus }
        : null,
    stageSummary: state.phase === "stage_done" ? stageSummary(state, stages) : null,
    aiEnabled,
    updatedAt,
  };
}

/** Plain-language briefing used when the AI foreman isn't available. */
export function fallbackBriefing(state: GameState): string {
  const stage = STAGES[state.stageIdx];
  const view = hud(state);
  const money =
    view.costOver > 0
      ? `We're $${view.costOver.toLocaleString("en-AU")} over budget`
      : `We've got $${(-view.costOver).toLocaleString("en-AU")} of contingency left`;
  const time =
    view.daysOver > 0
      ? `${view.daysOver} ${view.daysOver === 1 ? "day" : "days"} behind program`
      : `${-view.daysOver} ${-view.daysOver === 1 ? "day" : "days"} of float in hand`;
  const opener =
    state.stageIdx === 0
      ? "Righto, this one's yours to run."
      : `That's ${STAGES[state.stageIdx - 1].name.toLowerCase()} behind us.`;
  const watching = stage.focus.slice(0, 3);
  const watchList = `${watching.slice(0, -1).join(", ")} and ${watching[watching.length - 1]}`;
  const blurb = stage.blurb.charAt(0).toLowerCase() + stage.blurb.slice(1);
  return `${opener} ${money} and ${time}. Next up is ${stage.name.toLowerCase()}: ${blurb} I'll be watching ${watchList}. Over to you.`;
}
