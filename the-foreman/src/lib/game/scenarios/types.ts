import type { Quality, Site, StageId } from "../types";

// Scenario definitions hold the answers, so they must only ever be imported by
// server code (the game engine and API routes) — never by a client component.

export interface OptionDef {
  /** Stable id. Options are shuffled before they are shown to the student. */
  id: string;
  label: string;
  quality: Quality;
  /** Extra cost in AUD caused by this choice. */
  cost: number;
  /** Working days added to the program by this choice. */
  days: number;
  /** The choice leads to a failed or missed certifier inspection. */
  inspectionFail?: boolean;
  /** The choice is a work health and safety breach. */
  safety?: boolean;
  /** What happens on site as a result, in one or two sentences. */
  outcome: string;
}

export interface DecisionDef {
  id: string;
  stage: StageId;
  /** core = part of the normal build, site = only on sites where it applies, event = random site event. */
  kind: "core" | "site" | "event";
  /** Position in the build sequence within the stage (lower comes first). */
  order: number;
  /** Events only: how likely this event is to be drawn. */
  weight?: number;
  title: string;
  situation: string | ((site: Site) => string);
  question: string;
  options: OptionDef[];
  /** The authors' explanation of the right call, in plain site language. */
  why: string;
  /** NCC parts, Australian Standards and NSW requirements behind the answer. */
  refs: string[];
  /** CPC30220 unit codes this decision provides knowledge evidence for. */
  units: string[];
  /** Only use this scenario on sites where this returns true. */
  when?: (site: Site) => boolean;
  /** Ids of scenarios that tell a conflicting story and can't appear in the same job. */
  excludes?: string[];
}
