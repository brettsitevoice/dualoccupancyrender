import { totals } from "./engine";
import { STAGES } from "./stages";
import type { GameState, Scorecard, UnitEvidence } from "./types";
import { UNITS } from "./units";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const RATINGS: { min: number; label: string; note: string }[] = [
  {
    min: 85,
    label: "Ready to run the job",
    note: "Sound calls across the build, with compliance and sequence under control.",
  },
  {
    min: 70,
    label: "Solid leading hand",
    note: "Most calls were right. A few gaps to tighten up before running a job alone.",
  },
  {
    min: 50,
    label: "Getting there",
    note: "The basics are in place. Work through the missed calls with your teacher.",
  },
  {
    min: 0,
    label: "Back to the plans",
    note: "Plenty to learn from this one. Review each decision, then run another build.",
  },
];

/**
 * The debrief numbers for a finished (or part-finished) job.
 *
 * - Cost: 100 while the job finishes within budget, losing 20 points for every 1% over.
 * - Time: 100 while the job finishes within program, losing 5 points for each day over.
 * - Compliance: starts at 100. Minus 10 for each failed inspection or safety breach,
 *   minus 3 for each other wrong call, minus 1 for each partly right call.
 * - Decision quality: good = 1, partly right = 0.5, as a percentage of decisions made.
 * - Overall: 40% decision quality, 30% compliance, 15% cost, 15% time.
 */
export function buildScorecard(state: GameState): Scorecard {
  const sums = totals(state);
  const finalCost = state.site.baselineCost + sums.extraCost;
  const costOver = Math.max(0, finalCost - sums.budget);
  const finalDays = state.site.baselineDays + sums.extraDays;
  const daysOver = Math.max(0, finalDays - sums.programDays);

  const good = state.ledger.filter((entry) => entry.quality === "good").length;
  const partial = state.ledger.filter((entry) => entry.quality === "partial").length;
  const poor = state.ledger.filter((entry) => entry.quality === "poor").length;
  const total = state.ledger.length;
  const flagged = state.ledger.filter((entry) => entry.inspectionFail || entry.safety);
  const otherPoor = state.ledger.filter(
    (entry) => entry.quality === "poor" && !entry.inspectionFail && !entry.safety,
  ).length;
  const otherPartial = state.ledger.filter(
    (entry) => entry.quality === "partial" && !entry.inspectionFail && !entry.safety,
  ).length;

  const costScore = clamp(100 - (costOver / sums.budget) * 100 * 20);
  const timeScore = clamp(100 - daysOver * 5);
  const complianceScore = clamp(100 - flagged.length * 10 - otherPoor * 3 - otherPartial);
  const decisionScore = total === 0 ? 0 : clamp(((good + partial * 0.5) / total) * 100);
  const overall = clamp(
    decisionScore * 0.4 + complianceScore * 0.3 + costScore * 0.15 + timeScore * 0.15,
  );
  const rating = RATINGS.find((band) => overall >= band.min) ?? RATINGS[RATINGS.length - 1];

  const unitMap = new Map<string, UnitEvidence>();
  for (const entry of state.ledger) {
    const stageName = STAGES.find((stage) => stage.id === entry.stage)?.name ?? entry.stage;
    for (const code of entry.units) {
      const def = UNITS[code];
      if (!def) continue;
      let unit = unitMap.get(code);
      if (!unit) {
        unit = { code, title: def.title, elective: Boolean(def.elective), decisions: 0, points: 0, items: [] };
        unitMap.set(code, unit);
      }
      unit.decisions += 1;
      unit.points += entry.quality === "good" ? 1 : entry.quality === "partial" ? 0.5 : 0;
      unit.items.push({ title: entry.title, stage: stageName, quality: entry.quality });
    }
  }

  return {
    cost: {
      score: costScore,
      budget: sums.budget,
      finalCost,
      over: finalCost - sums.budget,
      extra: sums.extraCost,
      contingency: state.contingency,
    },
    time: {
      score: timeScore,
      programDays: sums.programDays,
      finalDays,
      over: finalDays - sums.programDays,
      extra: sums.extraDays,
      floatDays: state.floatDays,
    },
    compliance: {
      score: complianceScore,
      failedInspections: sums.failedInspections,
      safetyBreaches: sums.safetyBreaches,
      otherPoor,
      partial: otherPartial,
    },
    decisions: {
      score: decisionScore,
      good,
      partial,
      poor,
      total,
      ownWords: state.ledger.filter((entry) => entry.mode !== "tap").length,
    },
    overall,
    rating: { label: rating.label, note: rating.note },
    units: [...unitMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    stages: STAGES.map((stage) => ({
      id: stage.id,
      name: stage.name,
      items: state.ledger.filter((entry) => entry.stage === stage.id),
    })),
  };
}

/** Debrief used when the AI foreman isn't available. */
export function fallbackDebrief(state: GameState, card: Scorecard): string {
  const strong = card.units.filter((unit) => unit.decisions >= 2 && unit.points / unit.decisions >= 0.8);
  const weak = card.units.filter((unit) => unit.points / unit.decisions < 0.5);
  const parts: string[] = [];

  parts.push(
    `That's the job handed over. You made ${card.decisions.good} sound calls out of ${card.decisions.total}, with ${card.decisions.partial} partly right and ${card.decisions.poor} that cost you.`,
  );
  parts.push(
    card.cost.over > 0
      ? `It finished $${card.cost.over.toLocaleString("en-AU")} over budget`
      : `It came in $${(-card.cost.over).toLocaleString("en-AU")} under budget`,
  );
  parts[parts.length - 1] +=
    card.time.over > 0
      ? ` and ${card.time.over} ${card.time.over === 1 ? "day" : "days"} late.`
      : ` and ${-card.time.over} ${-card.time.over === 1 ? "day" : "days"} ahead of program.`;

  if (card.compliance.failedInspections + card.compliance.safetyBreaches > 0) {
    parts.push(
      `There were ${card.compliance.failedInspections} failed or missed inspections and ${card.compliance.safetyBreaches} safety breaches. Those are the ones to fix first: inspections get booked before work is covered, and nobody works at risk to save time.`,
    );
  } else {
    parts.push("No failed inspections and no safety breaches, which is exactly how a job should run.");
  }
  const names = (units: typeof strong) =>
    units
      .slice(0, 2)
      .map((unit) => `"${unit.title}"`)
      .join(" and ");
  if (strong.length > 0) parts.push(`Your strongest units were ${names(strong)}.`);
  if (weak.length > 0) parts.push(`The units to revisit first are ${names(weak)}. Then run another build.`);
  return parts.join(" ");
}
