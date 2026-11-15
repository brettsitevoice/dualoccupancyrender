import { FITOFF } from "./fitoff";
import { FOOTINGS } from "./footings";
import { FRAME } from "./frame";
import { HANDOVER } from "./handover";
import { LOCKUP } from "./lockup";
import { ROOF } from "./roof";
import { SETOUT } from "./setout";
import { SLAB } from "./slab";
import type { DecisionDef } from "./types";

export type { DecisionDef, OptionDef } from "./types";

/** Every authored decision and site event, across all eight stages. */
export const ALL_DECISIONS: DecisionDef[] = [
  ...SETOUT,
  ...FOOTINGS,
  ...SLAB,
  ...FRAME,
  ...ROOF,
  ...LOCKUP,
  ...FITOFF,
  ...HANDOVER,
];

export const DECISION_BY_ID: Map<string, DecisionDef> = new Map(
  ALL_DECISIONS.map((decision) => [decision.id, decision]),
);
