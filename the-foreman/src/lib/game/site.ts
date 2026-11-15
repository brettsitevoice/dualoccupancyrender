import { intBetween, makeRng, pick } from "./rng";
import { STAGES } from "./stages";
import type { Bal, RoofType, Season, Site, SoilClass, WindClass } from "./types";

interface RegionDef {
  suburb: string;
  region: string;
  climateZone: number;
  /** Range of distances to a surf coast in km, or null for inland sites. */
  coast: [number, number] | null;
  soils: SoilClass[];
  winds: WindClass[];
  bals: Bal[];
  /** Range of fall across the building platform, in metres. */
  fall: [number, number];
  /** Adjustment to the build rate in $/m². */
  rate: number;
}

// Typical conditions for new estates around New South Wales. Sites are
// generated for training: real blocks need their own soil report, wind
// classification and bushfire assessment.
const REGIONS: RegionDef[] = [
  {
    suburb: "Oran Park",
    region: "South-west Sydney",
    climateZone: 6,
    coast: null,
    soils: ["M", "H1", "H1", "H2"],
    winds: ["N1", "N2"],
    bals: ["BAL-LOW", "BAL-LOW", "BAL-12.5"],
    fall: [0.3, 1.4],
    rate: 60,
  },
  {
    suburb: "Marsden Park",
    region: "North-west Sydney",
    climateZone: 6,
    coast: null,
    soils: ["M", "H1", "H2"],
    winds: ["N1", "N2"],
    bals: ["BAL-LOW", "BAL-12.5"],
    fall: [0.2, 1.0],
    rate: 60,
  },
  {
    suburb: "Shell Cove",
    region: "Illawarra coast",
    climateZone: 5,
    coast: [0.3, 0.9],
    soils: ["S", "M", "M"],
    winds: ["N2", "N3"],
    bals: ["BAL-LOW"],
    fall: [0.4, 1.8],
    rate: 40,
  },
  {
    suburb: "Warnervale",
    region: "Central Coast",
    climateZone: 5,
    coast: null,
    soils: ["S", "M", "P"],
    winds: ["N1", "N2"],
    bals: ["BAL-LOW", "BAL-12.5", "BAL-19"],
    fall: [0.3, 1.5],
    rate: 20,
  },
  {
    suburb: "Thornton",
    region: "Lower Hunter",
    climateZone: 5,
    coast: null,
    soils: ["M", "H1", "P"],
    winds: ["N1", "N2"],
    bals: ["BAL-LOW", "BAL-12.5"],
    fall: [0.2, 1.2],
    rate: 0,
  },
  {
    suburb: "Winmalee",
    region: "Blue Mountains",
    climateZone: 6,
    coast: null,
    soils: ["A", "S", "M"],
    winds: ["N2", "N3"],
    bals: ["BAL-12.5", "BAL-19", "BAL-29"],
    fall: [0.8, 2.4],
    rate: 50,
  },
  {
    suburb: "Moss Vale",
    region: "Southern Highlands",
    climateZone: 7,
    coast: null,
    soils: ["M", "H1", "H2"],
    winds: ["N2"],
    bals: ["BAL-LOW", "BAL-12.5"],
    fall: [0.3, 1.6],
    rate: 10,
  },
  {
    suburb: "Wagga Wagga",
    region: "Riverina",
    climateZone: 4,
    coast: null,
    soils: ["M", "H1", "H2"],
    winds: ["N1", "N2"],
    bals: ["BAL-LOW", "BAL-12.5"],
    fall: [0.2, 1.0],
    rate: -60,
  },
  {
    suburb: "Port Macquarie",
    region: "Mid North Coast",
    climateZone: 5,
    coast: [0.5, 0.9],
    soils: ["S", "M", "P"],
    winds: ["N2", "N3"],
    bals: ["BAL-LOW", "BAL-12.5", "BAL-19"],
    fall: [0.3, 1.5],
    rate: -20,
  },
  {
    suburb: "Googong",
    region: "Queanbeyan region",
    climateZone: 7,
    coast: null,
    soils: ["S", "M", "H1"],
    winds: ["N2", "N3"],
    bals: ["BAL-LOW", "BAL-12.5", "BAL-19"],
    fall: [0.5, 2.0],
    rate: 30,
  },
];

const STREETS = [
  "Ironbark Rise",
  "Wattle Grove Road",
  "Kookaburra Avenue",
  "Bottlebrush Street",
  "Lyrebird Close",
  "Spotted Gum Drive",
  "Banksia Parade",
  "Currawong Crescent",
  "Stringybark Way",
  "Waratah Street",
  "Bluegum Circuit",
  "Rosella Place",
];

const MONTHS: { name: string; season: Season }[] = [
  { name: "January", season: "summer" },
  { name: "February", season: "summer" },
  { name: "March", season: "autumn" },
  { name: "April", season: "autumn" },
  { name: "May", season: "autumn" },
  { name: "June", season: "winter" },
  { name: "July", season: "winter" },
  { name: "August", season: "winter" },
  { name: "September", season: "spring" },
  { name: "October", season: "spring" },
  { name: "November", season: "spring" },
  { name: "December", season: "summer" },
];

const SOIL_NOTES: Record<SoilClass, string> = {
  A: "stable sand or rock, little or no ground movement",
  S: "slightly reactive clay, slight ground movement as moisture changes",
  M: "moderately reactive clay, moderate ground movement as moisture changes",
  H1: "highly reactive clay, high ground movement as moisture changes",
  H2: "highly reactive clay, very high ground movement as moisture changes",
  P: "a problem site, with footings designed by the engineer for the conditions found",
};

const SOIL_RATE: Record<SoilClass, number> = { A: -20, S: 0, M: 25, H1: 60, H2: 100, P: 130 };
const BAL_RATE: Record<Bal, number> = { "BAL-LOW": 0, "BAL-12.5": 30, "BAL-19": 55, "BAL-29": 110 };

const BASE_RATE = 2350; // AUD per square metre of house

export const CONTINGENCY_RATE = 0.03;
export const FLOAT_DAYS = 6;

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Planned working days for each stage on this site. */
export function stageDays(site: Pick<Site, "houseArea">): number[] {
  const factor = 0.9 + ((site.houseArea - 150) / 80) * 0.2;
  return STAGES.map((stage) => Math.max(2, Math.round(stage.days * factor)));
}

export function generateSite(seed: number): Site {
  const rng = makeRng(seed);
  const region = pick(rng, REGIONS);
  const month = pick(rng, MONTHS);
  const roof: RoofType = rng() < 0.5 ? "concrete tile" : "metal sheet";

  const houseArea = round(150 + rng() * 80, 5);
  const fall = round(region.fall[0] + rng() * (region.fall[1] - region.fall[0]), 0.1);
  const soilClass = pick(rng, region.soils);
  const windClass = pick(rng, region.winds);
  const bal = pick(rng, region.bals);
  const coastKm = region.coast
    ? round(region.coast[0] + rng() * (region.coast[1] - region.coast[0]), 0.1)
    : null;

  const rate =
    BASE_RATE +
    region.rate +
    SOIL_RATE[soilClass] +
    BAL_RATE[bal] +
    Math.round(fall * 55) +
    (windClass === "N3" ? 35 : 0) +
    (coastKm !== null && coastKm <= 1 ? 70 : 0);

  const partial = {
    houseArea,
  };

  return {
    seed,
    lot: `Lot ${intBetween(rng, 3, 480)}`,
    street: pick(rng, STREETS),
    suburb: region.suburb,
    region: region.region,
    lotWidth: round(12.5 + rng() * 5.5, 0.5),
    lotDepth: round(28 + rng() * 8, 1),
    fall: Number(fall.toFixed(1)),
    fallDirection: pick(rng, [
      "to the rear",
      "to the street",
      "across the block to the left",
      "across the block to the right",
    ]),
    soilClass,
    soilNote: SOIL_NOTES[soilClass],
    windClass,
    bal,
    climateZone: region.climateZone,
    coastKm: coastKm === null ? null : Number(coastKm.toFixed(1)),
    houseArea,
    bedrooms: houseArea >= 185 ? 4 : 3,
    roof,
    roofPitch: roof === "concrete tile" ? 20 : pick(rng, [15, 17.5, 20]),
    startMonth: month.name,
    startSeason: month.season,
    baselineCost: round(houseArea * rate, 1000),
    baselineDays: stageDays(partial).reduce((sum, days) => sum + days, 0),
  };
}

export function contingencyFor(site: Site): number {
  return round(site.baselineCost * CONTINGENCY_RATE, 500);
}

export function siteTitle(site: Site): string {
  return `${site.lot} ${site.street}, ${site.suburb}`;
}

/** One-paragraph description of the site, used in prompts and exports. */
export function describeSite(site: Site): string {
  const coast =
    site.coastKm === null ? "" : ` About ${Math.round(site.coastKm * 1000)} m from the surf coast.`;
  return (
    `${siteTitle(site)} (${site.region}), New South Wales. ` +
    `Lot ${site.lotWidth} m x ${site.lotDepth} m, falling ${site.fall} m ${site.fallDirection}. ` +
    `Soil Class ${site.soilClass} (${site.soilNote}). Wind classification ${site.windClass}. ` +
    `Bushfire attack level ${site.bal}. NCC climate zone ${site.climateZone}.${coast} ` +
    `Single-storey brick veneer house, ${site.houseArea} m², ${site.bedrooms} bedrooms, timber frame on a stiffened raft slab, ` +
    `${site.roof} roof at ${site.roofPitch}° pitch. Work starts in ${site.startMonth}.`
  );
}
