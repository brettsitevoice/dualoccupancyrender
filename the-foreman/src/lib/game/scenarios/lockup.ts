import type { DecisionDef } from "./types";

export const LOCKUP: DecisionDef[] = [
  {
    id: "lockup-window-flashing",
    stage: "lockup",
    kind: "core",
    order: 10,
    title: "Windows going in",
    situation:
      "Windows are being fitted before the brickies start. The carpenter is nailing through the reveals and moving on, with no flashing in sight. He says, 'The brickies seal it up when they lay the sill bricks.'",
    question: "What has to happen at each window?",
    options: [
      {
        id: "a",
        label:
          "Flash the head and sill, lap it into the wall wrap, and leave a settlement gap at the sill",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Every opening flashed and lapped into the wrap before the first brick was laid.",
      },
      {
        id: "b",
        label: "Run a good bead of exterior sealant around each window frame where it meets the wall wrap",
        quality: "partial",
        cost: 900,
        days: 1,
        outcome: "Sealant isn't flashing. The first windows were pulled back out to get the sill and head flashings in.",
      },
      {
        id: "c",
        label: "Leave it. The brickwork and sill bricks are what keep the weather out of a brick veneer wall",
        quality: "poor",
        cost: 6200,
        days: 3,
        outcome:
          "No flashings went in. Leaks showed up in the first storm: swollen sills and architraves, and brick courses pulled down to retrofit flashing.",
      },
    ],
    why: "Water gets into a brick veneer cavity every time it rains, and the flashings are what turn it back out. Openings need flashing to AS/NZS 2904 at the head and sill, lapped with the wall wrap, and windows are fixed so they sit plumb and square to AS 2047. Leave a gap between the sill brick and the window, so the timber frame can settle without loading the window.",
    refs: [
      "ABCB Housing Provisions Section 5: flashings and damp-proof courses at openings",
      "AS/NZS 2904 Damp-proof courses and flashings",
      "AS 2047 Windows and external glazed doors: installation",
      "AS 4200.2 Pliable building membranes: installation at openings",
    ],
    units: ["CPCCCA3010"],
  },
  {
    id: "lockup-glazing",
    stage: "lockup",
    kind: "core",
    order: 20,
    title: "The ensuite window",
    situation:
      "Checking the window delivery against the schedule: the ensuite window, with its sill 900 mm above the floor right beside the shower, has arrived with ordinary 4 mm float glass. The supplier says replacement safety glass is two weeks away. The brickie is keen to keep going.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Fit the frame now, and have it reglazed with safety glass and certified before lining",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Frame in, brickwork kept moving, and the pane was swapped for marked safety glass at the supplier's cost.",
      },
      {
        id: "b",
        label: "Accept it, and have a safety film stuck on the glass before handover so it holds together",
        quality: "partial",
        cost: 800,
        days: 1,
        outcome: "Film with no test evidence didn't satisfy the certifier. The glass was replaced anyway.",
      },
      {
        id: "c",
        label: "Install it as it is. It's a small window, well above the floor of the shower",
        quality: "poor",
        cost: 3200,
        days: 2,
        inspectionFail: true,
        outcome:
          "Final inspection: no safety glass mark on the ensuite window and no glazing certificate. Occupation certificate held up until it was reglazed.",
      },
    ],
    why: "People slip in bathrooms. The NCC and AS 1288 require safety glass, toughened or laminated, for glazing within 2 m of the floor in bathrooms and ensuites, and in doors and side panels. Every safety pane carries a permanent mark, and the window itself should be labelled to AS 2047 with its wind and water ratings. Check both on delivery, not at handover.",
    refs: [
      "AS 1288 Glass in buildings: human impact safety (bathrooms, doors, side panels)",
      "ABCB Housing Provisions Section 8: glazing",
      "AS 2047 Windows and external glazed doors: labelling and performance",
    ],
    units: ["CPCCCA3010", "CPCCCA2011"],
  },
  {
    id: "lockup-brick-veneer",
    stage: "lockup",
    kind: "core",
    order: 30,
    title: "Looking down the cavity",
    situation:
      "Brickwork is up to window-sill height on the first elevation. Looking down the cavity with a torch, you see mortar dags bridging across to the wall wrap, ties on only every second stud, and no weep holes in the course above the flashing.",
    question: "What do you get the bricklayer to fix?",
    options: [
      {
        id: "a",
        label:
          "Clean the cavity, ties at 600 mm each way, and weep holes at 1.2 m centres above the flashing",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Cavity cleaned, ties and weep holes corrected while the wall was still low enough to reach.",
      },
      {
        id: "b",
        label: "Add the weep holes and closer ties from here up. What's laid is laid and it's only a few courses",
        quality: "partial",
        cost: 1500,
        days: 1,
        outcome:
          "The certifier checked the lower courses with a camera. A section came down to fix the tie spacing and clean the cavity.",
      },
      {
        id: "c",
        label: "Leave it. A few mortar dags are normal, and nobody sees inside the cavity once it's finished",
        quality: "poor",
        cost: 8500,
        days: 4,
        outcome:
          "Damp patches on the inside walls after the first wet winter: bridged cavity and no weep holes. A warranty claim, and sections of brickwork rebuilt.",
      },
    ],
    why: "The cavity is the wall's drain. Mortar dags bridge it and carry water across to the frame, and weep holes let the water out. They go in the course right above the flashing, no more than 1.2 m apart. Wall ties hold the veneer to the frame: no more than 600 mm apart each way, and within 300 mm of openings and joints. It all gets hidden, which is exactly why you check it as it goes up.",
    refs: [
      "AS 4773.2 Masonry in small buildings: construction (wall ties, cavities, weep holes)",
      "ABCB Housing Provisions Section 5: masonry veneer ties, cavity and weepholes",
      "AS 2699.1 Built-in components for masonry construction: wall ties",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
  {
    id: "lockup-cladding",
    stage: "lockup",
    kind: "core",
    order: 40,
    title: "Gable cladding",
    situation:
      "The gable ends above the brickwork are fibre-cement weatherboards. The carpenter has started fixing boards straight onto the bare studs, with cut ends unsealed and the bottom board sitting hard down on the brickwork.",
    question: "What should change?",
    options: [
      {
        id: "a",
        label:
          "Wall wrap first, a flashing over the brickwork, and boards fixed to the maker's instructions",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Gable wrapped and flashed, boards fixed to the manufacturer's set-out with a clear gap over the flashing.",
      },
      {
        id: "b",
        label: "Keep going, but run a bead of sealant along the bottom board and prime the cut ends later",
        quality: "partial",
        cost: 800,
        days: 1,
        outcome: "Sealant in place of flashing fails within a few summers. The bottom boards came off to fit the flashing and wrap.",
      },
      {
        id: "c",
        label: "It's high up under the eave where the rain never reaches. Fix them as they are",
        quality: "poor",
        cost: 4200,
        days: 2,
        outcome:
          "Wind-driven rain ran down behind the boards onto the top of the brickwork and into the ceiling. Gable stripped and re-clad.",
      },
    ],
    why: "Cladding is a rain screen, not a seal. The wrap and flashings behind it do the waterproofing. The NCC requires cladding to be flashed at junctions and openings, and the manufacturer's instructions for fixings, laps, clearances and sealing cut edges are part of how the product complies. Any water that gets behind has to have a way back out.",
    refs: [
      "ABCB Housing Provisions Section 7: timber and composite wall cladding",
      "AS 4200.2 Pliable building membranes: installation",
      "NCC 2022 Volume Two Part H2: weatherproofing",
      "Manufacturer's installation instructions",
    ],
    units: ["CPCCCA3017"],
  },
  {
    id: "lockup-stormwater",
    stage: "lockup",
    kind: "core",
    order: 50,
    title: "Backfilling the stormwater",
    situation:
      "The plumber has laid the stormwater lines from the downpipes to the kerb outlet. The trenches are open, and the landscaper's bobcat is here today to backfill and level the yard.",
    question: "What do you do before backfilling?",
    options: [
      {
        id: "a",
        label:
          "Hold the backfill until the certifier has inspected the stormwater connections",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Stormwater inspected and passed with the trenches open. Backfilled the next morning.",
      },
      {
        id: "b",
        label: "Backfill everything except the connection points at the kerb and downpipes, so those can be seen",
        quality: "partial",
        cost: 500,
        days: 1,
        outcome: "The certifier wanted to see the lines and their falls, not just the ends. Two runs were dug back up.",
      },
      {
        id: "c",
        label: "Backfill now while the bobcat is here. It's only stormwater, and the plumber tested it",
        quality: "poor",
        cost: 3400,
        days: 2,
        inspectionFail: true,
        outcome: "Missed critical stage inspection. The lines were exposed again by hand, with a missed-inspection fee on top.",
      },
    ],
    why: "Covering stormwater drainage connections before they're inspected is one of the critical stage inspections in NSW. The certifier checks the pipes, the falls and where the water discharges against the approved plan. It's a cheap inspection while the trench is open and an expensive one once it's backfilled.",
    refs: [
      "EP&A (Development Certification and Fire Safety) Regulation 2021 (NSW): critical stage inspections (stormwater drainage connections)",
      "AS/NZS 3500.3 Stormwater drainage",
      "Approved stormwater plan",
    ],
    units: ["CPCCOM1014", "CPCCCA3025"],
  },
  {
    id: "lockup-articulation",
    stage: "lockup",
    kind: "site",
    order: 25,
    title: "Joints in the brickwork",
    when: (site) => site.soilClass === "M" || site.soilClass === "H1" || site.soilClass === "H2",
    situation: (site) =>
      `The site is Class ${site.soilClass}, reactive clay, and the engineer's drawings show articulation joints in the brickwork. The brickie says, 'Those joints look ugly. I'll lay it straight through and it'll be right.'`,
    question: "What do you tell him?",
    options: [
      {
        id: "a",
        label:
          "Build the joints where the drawings show them, with a clean gap, filler and sealant",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Joints built in as drawn, lined up with the window openings so they hardly show.",
      },
      {
        id: "b",
        label: "Put joints in at the big window openings, where cracks usually start, and skip the long walls",
        quality: "partial",
        cost: 1800,
        days: 1,
        outcome: "The engineer wanted every joint on the drawing. Two were saw-cut in afterwards, and ties had to be added beside them.",
      },
      {
        id: "c",
        label: "Lay it straight through with no joints. The engineered slab will stop the walls moving",
        quality: "poor",
        cost: 9000,
        days: 3,
        outcome:
          "In the first dry summer the clay shrank and the brickwork cracked in stepped lines from the window corners. Warranty repairs and retro-cut joints.",
      },
    ],
    why: "Reactive clay swells when it's wet and shrinks when it's dry, and the slab flexes with it. Brickwork is brittle, so on reactive sites the NCC and AS 4773 require vertical articulation joints, typically no more than about 6 m apart and at openings, so the wall moves at the joint instead of cracking through the bricks. The joint is a clean gap filled with compressible backing and sealant, never mortar.",
    refs: [
      "ABCB Housing Provisions Section 5: vertical articulation joints",
      "AS 4773.1 and AS 4773.2 Masonry in small buildings",
      "AS 2870 Residential slabs and footings: site classification",
      "Engineer's drawings",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
  {
    id: "lockup-bushfire",
    stage: "lockup",
    kind: "site",
    order: 22,
    title: "Building for embers",
    when: (site) => site.bal !== "BAL-LOW",
    situation: (site) =>
      `The site is rated ${site.bal}. The windows have arrived with standard fibreglass flyscreens, and the brickie has left the weep holes open as usual.`,
    question: "What needs to change for the bushfire rating?",
    options: [
      {
        id: "a",
        label:
          "Build to AS 3959 for this BAL: 2 mm metal mesh screens, screened weep holes, sealed gaps",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Screens re-ordered in metal mesh and weephole guards fitted as the brickwork went up.",
      },
      {
        id: "b",
        label: "Swap the flyscreens to metal mesh, but leave the weep holes open. They're tiny and need to drain",
        quality: "partial",
        cost: 700,
        days: 1,
        outcome:
          "Open weep holes are about 10 mm wide, well over the 3 mm limit for gaps. Stainless weephole screens were retrofitted.",
      },
      {
        id: "c",
        label: "Leave it. Bushfire rules are for houses out in the bush, not a street in a new estate",
        quality: "poor",
        cost: 5600,
        days: 3,
        inspectionFail: true,
        outcome:
          "The final inspection went through the BAL schedule line by line. Screens replaced, weephole and vent guards retrofitted, and a consultant's compliance report.",
      },
    ],
    why: "Most houses lost in bushfires are lit by embers, not the fire front. Embers get in through gaps, vents and broken windows. AS 3959 sets the construction requirements for each Bushfire Attack Level. At this BAL that includes corrosion-resistant metal mesh with a 2 mm maximum aperture over opening windows, vents and weep holes, sealing gaps wider than 3 mm, and specific glazing and doors. It's a condition of the approval.",
    refs: [
      "AS 3959 Construction of buildings in bushfire-prone areas",
      "NCC 2022 Volume Two Part H7: construction in bushfire prone areas",
      "NSW RFS Planning for Bush Fire Protection 2019",
      "Development consent: BAL conditions",
    ],
    units: ["CPCCCA3010", "CPCCCA3025"],
  },
  {
    id: "lockup-coastal",
    stage: "lockup",
    kind: "site",
    order: 28,
    title: "Salt in the air",
    when: (site) => site.coastKm !== null && site.coastKm <= 1,
    situation: (site) =>
      `The site is about ${Math.round((site.coastKm ?? 0) * 1000)} m from the surf. The brickie has turned up with standard galvanised wall ties and is mixing a general-purpose mortar. The bricks on the pallet are marked general purpose, not exposure grade.`,
    question: "Is that right for this site?",
    options: [
      {
        id: "a",
        label:
          "No. This close to the surf it needs exposure-grade bricks, M4 mortar and stainless ties",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Materials swapped before a brick was laid. Dockets on file showing the durability grades.",
      },
      {
        id: "b",
        label: "Change to stainless ties, but use the bricks and mortar already on site so the job keeps moving",
        quality: "partial",
        cost: 2500,
        days: 2,
        outcome:
          "The durability notes called for exposure-grade bricks and M4 mortar as well. The bricks went back and the first two courses came down.",
      },
      {
        id: "c",
        label: "Bricks are bricks, and the house is set back from the beach. Carry on",
        quality: "poor",
        cost: 9500,
        days: 4,
        outcome:
          "The certifier checked the delivery dockets against the durability notes. Brickwork demolished and re-laid in the right materials.",
      },
    ],
    why: "Salt spray eats ordinary bricks, mortar and galvanised steel. Within 1 km of a surf coast, AS 3700 and AS 4773 class the site as a severe marine environment: the bricks have to be exposure grade, the mortar M4, and built-in steel like ties and lintels stainless. Check the delivery dockets and the tie packaging before a brick is laid.",
    refs: [
      "AS 4773.1 Masonry in small buildings: durability and exposure environments",
      "AS 3700 Masonry structures: durability requirements",
      "AS 2699 Built-in components for masonry construction: durability classes for ties and lintels",
    ],
    units: ["CPCCCA2011", "CPCCCA3025"],
  },
  {
    id: "event-subbie-noshow",
    stage: "lockup",
    kind: "event",
    order: 26,
    weight: 3,
    title: "Subcontractor no-show",
    situation:
      "7:30 am Monday. The bricklaying gang was due at 7. Bricks, sand and scaffold are all on site, but no brickies. Their boss finally answers: they're stuck on another job for 'a week, maybe two'. Your labourer says his cousin lays bricks on weekends and could start tomorrow for cash.",
    question: "How do you respond?",
    options: [
      {
        id: "a",
        label:
          "Get a firm date in writing, bring other work forward, and line up another licensed gang",
        quality: "good",
        cost: 800,
        days: 2,
        outcome: "Internal rough-in was brought forward and a second licensed gang started Wednesday. Two days lost.",
      },
      {
        id: "b",
        label: "Wait for them. They're good brickies, the scaffold is already up and it's only a week or two",
        quality: "partial",
        cost: 1500,
        days: 4,
        outcome: "Two weeks became three. Scaffold hire kept ticking and the program slipped.",
      },
      {
        id: "c",
        label: "Get the cousin started tomorrow for cash. It keeps the job moving and saves money",
        quality: "poor",
        cost: 9500,
        days: 4,
        outcome:
          "Unlicensed, uninsured work: wavy walls, no weep holes and no certificate. The certifier and the insurer both wanted it rectified, and most of it came down.",
      },
    ],
    why: "A no-show is a program problem, so manage it like one: get a committed date, shuffle other trades forward, and line up a replacement if you need to. The replacement still has to be licensed for the work, insured, inducted and on a written subcontract. In NSW, residential building work worth more than $5,000 needs a contractor licence. Cheap cash labour is the dearest option on site.",
    refs: [
      "Home Building Act 1989 (NSW): contractor licensing for residential building work",
      "WHS Regulation 2017 (NSW): general construction induction and site induction",
      "Subcontract agreement and insurances",
    ],
    units: ["CPCCOM1014", "CPCCOM1012"],
  },
  {
    id: "event-scaffold",
    stage: "lockup",
    kind: "event",
    order: 35,
    weight: 1,
    title: "Scaffold with bits missing",
    situation:
      "The brickies' scaffold runs down the side of the house with its working deck at 2.4 m. Overnight, someone has pulled two planks and a section of handrail off it to use elsewhere. The roof plumber is about to climb up to fit a downpipe.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Tag it out, and have a competent person reinstate and check it before anyone uses it",
        quality: "good",
        cost: 250,
        days: 0,
        outcome: "Scaffold tagged out, reinstated and checked by mid-morning. The plumber went up after that.",
      },
      {
        id: "b",
        label: "Tell the plumber about the gap and to stay on the full planks. He's only up there ten minutes",
        quality: "partial",
        cost: 800,
        days: 1,
        safety: true,
        outcome: "He stepped back into the gap and caught himself on the ledger: bruised ribs and a lost-time injury report.",
      },
      {
        id: "c",
        label: "Say nothing. He's a licensed trade and it's his job to check his own access",
        quality: "poor",
        cost: 7000,
        days: 3,
        safety: true,
        outcome:
          "A fall from the open edge and a broken ankle. As the builder, the scaffold was yours to manage: prohibition notice and a penalty.",
      },
    ],
    why: "A scaffold is only safe when it's complete. Any deck someone could fall 2 m or more from needs full planking, guardrails, mid-rails and toe boards, and only a competent person alters it. That means a licensed scaffolder once a person or object could fall more than 4 m. Incomplete scaffold gets tagged out and nobody uses it. Managing that is the builder's job, not each subcontractor's.",
    refs: [
      "WHS Regulation 2017 (NSW): scaffolds and managing the risk of falls",
      "AS/NZS 4576 Guidelines for scaffolding",
      "SafeWork NSW Code of Practice: Construction work",
    ],
    units: ["CPCCCM2008", "CPCCCM2012", "CPCWHS3001"],
  },
];
