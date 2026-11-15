// Units of competency from CPC30220 Certificate III in Carpentry that the
// simulator's decisions are mapped to. The simulator produces supporting
// (knowledge) evidence only — the assessor makes the competency decision.

export interface UnitDef {
  code: string;
  title: string;
  /** True for elective units in CPC30220; the rest are core units. */
  elective?: boolean;
}

export const UNITS: Record<string, UnitDef> = {
  CPCCCA2011: { code: "CPCCCA2011", title: "Handle carpentry materials" },
  CPCCCA3002: { code: "CPCCCA3002", title: "Carry out setting out" },
  CPCCCA3004: { code: "CPCCCA3004", title: "Construct and erect wall frames" },
  CPCCCA3006: { code: "CPCCCA3006", title: "Erect roof trusses" },
  CPCCCA3007: { code: "CPCCCA3007", title: "Construct pitched roofs" },
  CPCCCA3008: { code: "CPCCCA3008", title: "Construct eaves" },
  CPCCCA3010: { code: "CPCCCA3010", title: "Install windows and doors" },
  CPCCCA3012: { code: "CPCCCA3012", title: "Frame and fit wet area fixtures", elective: true },
  CPCCCA3017: { code: "CPCCCA3017", title: "Install exterior cladding" },
  CPCCCA3024: { code: "CPCCCA3024", title: "Install lining, panelling and moulding" },
  CPCCCA3025: {
    code: "CPCCCA3025",
    title: "Read and interpret plans, specifications and drawings for carpentry work",
  },
  CPCCCA3028: {
    code: "CPCCCA3028",
    title: "Erect and dismantle formwork for footings and slabs on ground",
  },
  CPCCCM2006: { code: "CPCCCM2006", title: "Apply basic levelling procedures" },
  CPCCCM2008: { code: "CPCCCM2008", title: "Erect and dismantle restricted height scaffolding" },
  CPCCCM2012: { code: "CPCCCM2012", title: "Work safely at heights" },
  CPCCCO2013: { code: "CPCCCO2013", title: "Carry out concreting to simple forms" },
  CPCCOM1012: {
    code: "CPCCOM1012",
    title: "Work effectively and sustainably in the construction industry",
  },
  CPCCOM1014: { code: "CPCCOM1014", title: "Conduct workplace communication" },
  CPCCOM1015: { code: "CPCCOM1015", title: "Carry out measurements and calculations" },
  CPCCOM3001: {
    code: "CPCCOM3001",
    title: "Perform construction calculations to determine carpentry material requirements",
  },
  CPCCOM3006: { code: "CPCCOM3006", title: "Carry out levelling operations" },
  CPCCSF2004: { code: "CPCCSF2004", title: "Place and fix reinforcement materials", elective: true },
  CPCCWHS2001: {
    code: "CPCCWHS2001",
    title: "Apply WHS requirements, policies and procedures in the construction industry",
  },
  CPCWHS3001: {
    code: "CPCWHS3001",
    title: "Identify construction work hazards and select risk control strategies",
  },
};

export const QUALIFICATION = {
  code: "CPC30220",
  title: "Certificate III in Carpentry",
};
