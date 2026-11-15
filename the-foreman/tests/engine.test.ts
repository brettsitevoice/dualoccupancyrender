import { describe, expect, it } from "vitest";
import {
  advance,
  applyAnswer,
  buildPlan,
  currentDecision,
  GameError,
  newGame,
  resolveSpoken,
  resolveTap,
  shownOptions,
  startGame,
  toView,
  totals,
} from "../src/lib/game/engine";
import { ALL_DECISIONS, DECISION_BY_ID } from "../src/lib/game/scenarios";
import { buildScorecard, fallbackDebrief } from "../src/lib/game/scorecard";
import { generateSite } from "../src/lib/game/site";
import { STAGES } from "../src/lib/game/stages";
import { STAGE_IDS, type BuildLength, type GameState, type Quality } from "../src/lib/game/types";
import { UNITS } from "../src/lib/game/units";

const NOW = "2026-01-01T00:00:00.000Z";

function play(seed: number, length: BuildLength, choose: Quality | ((n: number) => Quality)): GameState {
  let state = startGame(newGame(seed, NOW), length, NOW);
  let n = 0;
  for (let guard = 0; guard < 500 && state.phase !== "complete"; guard++) {
    if (state.phase === "decision") {
      const decision = currentDecision(state)!;
      const want = typeof choose === "function" ? choose(n++) : choose;
      const option =
        decision.options.find((candidate) => candidate.quality === want) ??
        decision.options.find((candidate) => candidate.quality === "poor")!;
      state = applyAnswer(
        state,
        { mode: "tap", answer: option.label, resolved: resolveTap(decision, option.id), feedback: "", aiFeedback: false },
        NOW,
      );
    } else {
      state = advance(state, NOW);
    }
  }
  return state;
}

describe("scenario bank", () => {
  it("has unique ids", () => {
    expect(new Set(ALL_DECISIONS.map((decision) => decision.id)).size).toBe(ALL_DECISIONS.length);
  });

  it("has well-formed decisions", () => {
    for (const decision of ALL_DECISIONS) {
      const label = decision.id;
      expect(STAGE_IDS, label).toContain(decision.stage);
      expect(decision.options.length, label).toBeGreaterThanOrEqual(3);
      expect(decision.options.length, label).toBeLessThanOrEqual(4);
      expect(new Set(decision.options.map((option) => option.id)).size, label).toBe(decision.options.length);
      expect(decision.options.filter((option) => option.quality === "good").length, label).toBe(1);
      expect(decision.options.some((option) => option.quality === "poor"), label).toBe(true);
      expect(decision.refs.length, label).toBeGreaterThan(0);
      expect(decision.units.length, label).toBeGreaterThan(0);
      expect(decision.why.length, label).toBeGreaterThan(80);
      for (const code of decision.units) expect(UNITS[code], `${label} ${code}`).toBeDefined();
      for (const id of decision.excludes ?? []) expect(DECISION_BY_ID.has(id), `${label} excludes ${id}`).toBe(true);
      for (const option of decision.options) {
        expect(option.label.length, `${label}/${option.id}`).toBeLessThanOrEqual(210);
        expect(option.cost, `${label}/${option.id}`).toBeGreaterThanOrEqual(0);
        expect(option.days, `${label}/${option.id}`).toBeGreaterThanOrEqual(0);
        expect(option.outcome.length, `${label}/${option.id}`).toBeGreaterThan(10);
      }
      // A worse answer never costs less than a better one.
      const good = decision.options.find((option) => option.quality === "good")!;
      for (const option of decision.options) {
        if (option.quality !== "good") {
          expect(option.cost + option.days * 1000, `${label}/${option.id}`).toBeGreaterThan(
            good.cost + good.days * 1000,
          );
        }
      }
      // Decisions that are part of the planned build keep the job on budget when answered well.
      if (decision.kind !== "event") {
        expect(good.cost, label).toBe(0);
        expect(good.days, label).toBe(0);
      } else {
        expect(decision.weight, label).toBeGreaterThan(0);
      }
    }
  });

  it("doesn't give the answer away by length", () => {
    // If the right option is usually the longest, students can score well without reading.
    let goodIsLongest = 0;
    let goodIsShortest = 0;
    for (const decision of ALL_DECISIONS) {
      const good = decision.options.find((option) => option.quality === "good")!;
      const others = decision.options.filter((option) => option.quality !== "good");
      if (others.every((option) => good.label.length > option.label.length)) goodIsLongest++;
      if (others.every((option) => good.label.length < option.label.length)) goodIsShortest++;
      for (const option of decision.options) {
        expect(option.label.length, `${decision.id}/${option.id}`).toBeGreaterThanOrEqual(55);
        expect(option.label.length, `${decision.id}/${option.id}`).toBeLessThanOrEqual(115);
      }
    }
    expect(goodIsLongest / ALL_DECISIONS.length).toBeLessThan(0.45);
    expect(goodIsShortest / ALL_DECISIONS.length).toBeLessThan(0.45);
  });

  it("has enough core decisions in every stage for a full build", () => {
    for (const stage of STAGES) {
      for (let seed = 1; seed <= 60; seed++) {
        const site = generateSite(seed);
        const core = ALL_DECISIONS.filter(
          (decision) => decision.stage === stage.id && decision.kind === "core" && (!decision.when || decision.when(site)),
        );
        expect(core.length, `${stage.id} seed ${seed}`).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

describe("site generator", () => {
  it("is deterministic and sensible", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const site = generateSite(seed);
      expect(generateSite(seed)).toEqual(site);
      expect(site.houseArea).toBeGreaterThanOrEqual(150);
      expect(site.houseArea).toBeLessThanOrEqual(230);
      expect(site.baselineCost).toBeGreaterThan(300_000);
      expect(site.baselineCost).toBeLessThan(700_000);
      expect(site.baselineDays).toBeGreaterThan(100);
      expect(site.baselineDays).toBeLessThan(160);
      expect(site.fall).toBeGreaterThan(0);
      expect(site.climateZone).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("plan", () => {
  it("builds the right number of decisions and respects site conditions and exclusions", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const site = generateSite(seed);
      for (const length of ["quick", "full"] as const) {
        const plan = buildPlan(site, seed, length);
        const ids = STAGES.flatMap((stage) => plan[stage.id]);
        expect(new Set(ids).size).toBe(ids.length);
        const decisions = ids.map((id) => DECISION_BY_ID.get(id)!);
        const events = decisions.filter((decision) => decision.kind === "event");
        expect(events.length).toBe(length === "full" ? 4 : 2);
        expect(new Set(events.map((event) => event.stage)).size).toBe(events.length);
        for (const stage of STAGES) {
          const inStage = plan[stage.id].map((id) => DECISION_BY_ID.get(id)!);
          expect(inStage.filter((decision) => decision.kind !== "event").length).toBe(length === "full" ? 3 : 2);
          expect(inStage.every((decision) => decision.stage === stage.id)).toBe(true);
          const orders = inStage.map((decision) => decision.order);
          expect(orders).toEqual([...orders].sort((a, b) => a - b));
        }
        for (const decision of decisions) {
          if (decision.when) expect(decision.when(site), decision.id).toBe(true);
          for (const other of decision.excludes ?? []) expect(ids, `${decision.id} with ${other}`).not.toContain(other);
        }
        expect(buildPlan(site, seed, length)).toEqual(plan);
      }
    }
  });
});

describe("play-through", () => {
  it("keeps a well-run job on budget and on program", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const state = play(seed, "full", "good");
      expect(state.phase).toBe("complete");
      expect(state.ledger.length).toBe(28);
      const card = buildScorecard(state);
      expect(card.cost.over, `seed ${seed}`).toBeLessThanOrEqual(0);
      expect(card.time.over, `seed ${seed}`).toBeLessThanOrEqual(0);
      expect(card.compliance.score).toBe(100);
      expect(card.decisions.score).toBe(100);
      expect(card.overall).toBe(100);
      expect(card.units.length).toBeGreaterThan(8);
    }
  });

  it("punishes a badly run job", () => {
    const state = play(7, "full", "poor");
    const card = buildScorecard(state);
    expect(card.cost.over).toBeGreaterThan(0);
    expect(card.time.over).toBeGreaterThan(0);
    expect(card.decisions.score).toBe(0);
    expect(card.overall).toBeLessThan(20);
    expect(card.compliance.failedInspections + card.compliance.safetyBreaches).toBeGreaterThan(3);
    expect(fallbackDebrief(state, card).length).toBeGreaterThan(100);
  });

  it("gives a middling score for a mixed job", () => {
    const pattern: Quality[] = ["good", "good", "partial", "good", "poor", "good"];
    const state = play(11, "full", (n) => pattern[n % pattern.length]);
    const card = buildScorecard(state);
    expect(card.overall).toBeGreaterThan(40);
    expect(card.overall).toBeLessThan(90);
  });

  it("plays a quick build in 18 decisions", () => {
    const state = play(3, "quick", "good");
    expect(state.ledger.length).toBe(18);
    expect(state.completedAt).toBe(NOW);
  });

  it("enforces the order of play", () => {
    const fresh = newGame(5, NOW);
    expect(() => advance(fresh, NOW)).toThrow(GameError);
    const started = startGame(fresh, "quick", NOW);
    expect(() => startGame(started, "quick", NOW)).toThrow(GameError);
    const deciding = advance(started, NOW);
    expect(deciding.phase).toBe("decision");
    expect(() => advance(deciding, NOW)).toThrow(GameError);
    const decision = currentDecision(deciding)!;
    expect(() => resolveTap(decision, "zz")).toThrow(GameError);
    const answered = applyAnswer(
      deciding,
      { mode: "tap", answer: "x", resolved: resolveTap(decision, decision.options[0].id), feedback: "", aiFeedback: false },
      NOW,
    );
    expect(() =>
      applyAnswer(
        answered,
        { mode: "tap", answer: "x", resolved: resolveTap(decision, decision.options[0].id), feedback: "", aiFeedback: false },
        NOW,
      ),
    ).toThrow(GameError);
    expect(totals(answered).extraCost).toBe(decision.options[0].cost);
  });
});

describe("views", () => {
  it("never leaks answers before the student has answered", () => {
    for (let seed = 1; seed <= 25; seed++) {
      let state = startGame(newGame(seed, NOW), "full", NOW);
      for (let guard = 0; guard < 500 && state.phase !== "complete"; guard++) {
        const view = toView("job", state, NOW, true);
        if (state.phase === "decision") {
          const decision = currentDecision(state)!;
          const json = JSON.stringify({ ...view, site: undefined });
          expect(json).not.toContain('"quality"');
          expect(json).not.toContain(decision.why.slice(0, 40));
          for (const option of decision.options) expect(json).not.toContain(option.outcome);
          expect(view.result).toBeNull();
          expect(view.decision!.options.map((option) => option.id).sort()).toEqual(
            decision.options.map((option) => option.id).sort(),
          );
          const option = decision.options[guard % decision.options.length];
          state = applyAnswer(
            state,
            { mode: "tap", answer: option.label, resolved: resolveTap(decision, option.id), feedback: "", aiFeedback: false },
            NOW,
          );
          const after = toView("job", state, NOW, true);
          expect(after.result!.quality).toBe(option.quality);
          expect(after.result!.feedback).toBe(decision.why);
          expect(after.decision).toBeNull();
        } else {
          state = advance(state, NOW);
        }
      }
    }
  });

  it("shuffles options so the best call isn't always first", () => {
    const state = startGame(newGame(21, NOW), "full", NOW);
    const firstIsGood = ALL_DECISIONS.filter((decision) => shownOptions(state, decision)[0].quality === "good").length;
    expect(firstIsGood).toBeGreaterThan(ALL_DECISIONS.length * 0.15);
    expect(firstIsGood).toBeLessThan(ALL_DECISIONS.length * 0.55);
  });
});

describe("answers in the student's own words", () => {
  const decision = DECISION_BY_ID.get("slab-prepour-inspection")!;

  it("uses the matched option when its rating agrees with the verdict", () => {
    expect(resolveSpoken(decision, "poor", "c")).toMatchObject({ optionId: "c", cost: 7500, inspectionFail: true });
    expect(resolveSpoken(decision, "good", "a")).toMatchObject({ optionId: "a", cost: 0, days: 0 });
  });

  it("uses the authored cost for the verdict when the match disagrees", () => {
    const outcome = resolveSpoken(decision, "partial", "a");
    expect(outcome).toMatchObject({ quality: "partial", cost: 450, days: 1 });
    expect(outcome.outcome).not.toContain("48 hours");
  });

  it("copes with no matching option", () => {
    expect(resolveSpoken(decision, "poor", null)).toMatchObject({ quality: "poor", cost: 7500 });
    expect(resolveSpoken(decision, "good", "nope")).toMatchObject({ quality: "good", cost: 0, optionId: null });
  });
});
