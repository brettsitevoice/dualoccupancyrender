import type { StageId } from "./types";

export interface StageDef {
  id: StageId;
  n: number;
  name: string;
  /** One line shown under the stage name. */
  blurb: string;
  /** What the stage covers — used in the foreman's briefing. */
  scope: string;
  /** Topics the foreman is watching this stage (themes, not answers). */
  focus: string[];
  /** Share of the planned build cost spent in this stage. */
  costShare: number;
  /** Planned working days for a mid-sized house. */
  days: number;
  /** Critical stage inspection signed off in this stage, if any. */
  inspection: string | null;
}

export const STAGES: StageDef[] = [
  {
    id: "setout",
    n: 1,
    name: "Set-out",
    blurb: "Get the site legal, safe and pegged in the right spot.",
    scope:
      "Site establishment (fencing, signage, amenities, sediment control, approvals in place), locating boundaries and services, and setting out the building lines and floor level from the approved plans.",
    focus: ["site set-up and approvals", "boundaries and set-out accuracy", "levels", "what's under the ground"],
    costShare: 0.05,
    days: 6,
    inspection: null,
  },
  {
    id: "footings",
    n: 2,
    name: "Footings",
    blurb: "Dig to the engineer's drawings and get it inspected.",
    scope:
      "Site cut, excavating edge and internal beams and any piers to the engineer's drawings, checking founding material, under-slab drainage by the plumber, and the certifier's footing excavation inspection.",
    focus: ["building to the engineer's drawings", "founding material", "excavation safety", "inspection before anything is covered"],
    costShare: 0.07,
    days: 9,
    inspection: "Footing excavation inspection",
  },
  {
    id: "slab",
    n: 3,
    name: "Slab",
    blurb: "Membrane, steel, inspection, pour and cure.",
    scope:
      "Formwork, damp-proofing membrane, reinforcement placement, the pre-pour inspection, ordering and placing concrete, finishing and curing the stiffened raft slab.",
    focus: ["membrane and steel placement", "the pre-pour inspection", "concrete quality on pour day", "curing and early loading"],
    costShare: 0.1,
    days: 11,
    inspection: "Pre-pour steel inspection",
  },
  {
    id: "frame",
    n: 4,
    name: "Frame",
    blurb: "Stand it square, brace it and tie it down.",
    scope:
      "Setting out wall plates, standing and plumbing timber wall frames, temporary and permanent bracing, lintels and openings, tie-down for the site's wind class, and wall wrap.",
    focus: ["set-out off the plans", "bracing", "tie-down for the wind class", "materials matching the plans"],
    costShare: 0.14,
    days: 16,
    inspection: null,
  },
  {
    id: "roof",
    n: 5,
    name: "Roof",
    blurb: "Trusses up, roof on, nobody falls.",
    scope:
      "Checking and erecting nailplated roof trusses, truss bracing, roof covering and its fixing, fascia, gutters and downpipes, and working safely at height.",
    focus: ["truss handling and erection", "working at height", "roof fixing for the wind class", "roof drainage"],
    costShare: 0.11,
    days: 12,
    inspection: null,
  },
  {
    id: "lockup",
    n: 6,
    name: "Lock-up",
    blurb: "Bricks, windows, doors and cladding — keep the water out.",
    scope:
      "Installing windows and external doors with flashings, brick veneer (ties, cavity, weep holes, joints), lightweight cladding to gables, stormwater drainage, and getting the house weathertight and lockable.",
    focus: ["flashings and weatherproofing", "glazing", "brick veneer details", "site-specific requirements"],
    costShare: 0.19,
    days: 26,
    inspection: "Stormwater connection inspection",
  },
  {
    id: "fitoff",
    n: 7,
    name: "Fit-off",
    blurb: "Rough-in, linings, wet areas and finishes — in the right order.",
    scope:
      "Services rough-in, the certifier's frame inspection before lining, insulation and plasterboard, wet area waterproofing and its inspection, fix-out carpentry, tiling, painting, and electrical and plumbing fit-off.",
    focus: ["inspections before covering work", "wet areas", "trade sequence", "safety and health requirements"],
    costShare: 0.29,
    days: 44,
    inspection: "Frame and wet area inspections",
  },
  {
    id: "handover",
    n: 8,
    name: "Handover",
    blurb: "Final inspection, paperwork, defects and keys.",
    scope:
      "Pre-handover defect inspection, external works and site drainage, compliance certificates, the final inspection and occupation certificate, and handing the house over to the owner.",
    focus: ["the occupation certificate", "certificates and paperwork", "defects and tolerances", "looking after the owner"],
    costShare: 0.05,
    days: 8,
    inspection: "Final inspection",
  },
];

export const STAGE_BY_ID: Record<StageId, StageDef> = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage]),
) as Record<StageId, StageDef>;
