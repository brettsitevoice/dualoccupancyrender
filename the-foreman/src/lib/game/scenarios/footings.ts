import type { DecisionDef } from "./types";

export const FOOTINGS: DecisionDef[] = [
  {
    id: "footings-engineer-drawings",
    stage: "footings",
    kind: "core",
    order: 10,
    title: "Digging to the drawings",
    situation: (site) =>
      `The soil report classifies the site as Class ${site.soilClass}: ${site.soilNote}. The engineer's drawings show a stiffened raft slab with edge and internal beams. The excavator operator says, 'These engineers always over-design. I can save you a day if we don't go as deep as the drawings.'`,
    question: "What's your call?",
    options: [
      {
        id: "a",
        label: "Dig to the drawings. Any change has to come from the engineer in writing",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Beams dug to the drawings. The certifier's tape matched the plans.",
      },
      {
        id: "b",
        label: "Ring the engineer from site, and go shallower if they say it's okay over the phone",
        quality: "partial",
        cost: 300,
        days: 1,
        outcome:
          "The engineer said no, and wanted the question in writing anyway. Most of a day lost waiting on the reply.",
      },
      {
        id: "c",
        label: "Go shallower where the clay is hard. The operator has dug hundreds of these and knows the ground",
        quality: "poor",
        cost: 6500,
        days: 4,
        inspectionFail: true,
        outcome:
          "The certifier measured the trenches against the drawings and failed the footing inspection. Re-excavation, an engineer's site visit and a re-inspection fee.",
      },
    ],
    why: "The footing design comes from the soil classification under AS 2870. Reactive clay swells and shrinks with moisture, and beam depth is what stiffens the slab against that movement. Nobody on site gets to change an engineered detail. If something doesn't work, the engineer revises it in writing and the certifier gets a copy.",
    refs: [
      "AS 2870 Residential slabs and footings: site classification and footing design",
      "NCC 2022 Volume Two Part H1 (Structure): footings and slabs",
      "Engineer's drawings and the geotechnical report",
    ],
    units: ["CPCCCA3025", "CPCCCA3028"],
  },
  {
    id: "footings-soft-spot",
    stage: "footings",
    kind: "core",
    order: 20,
    title: "Soft spot in the trench",
    situation:
      "While trimming the edge beam trench, the operator hits a soft, dark pocket about 2 m long. It's old fill with bits of brick in it. The drawings say the footings are to be founded on natural stiff clay.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label: "Stop digging there and get a written direction from the engineer",
        quality: "good",
        cost: 0,
        days: 0,
        outcome:
          "The engineer had two piers bored through the fill to natural ground. Sorted the same day, with the direction on file.",
      },
      {
        id: "b",
        label: "Dig the soft material out until it looks firm, and fill the hole with concrete at the pour",
        quality: "partial",
        cost: 1200,
        days: 1,
        outcome:
          "It might have been fine, but with nothing from the engineer the certifier wanted it confirmed. Urgent site visit and a day's wait.",
      },
      {
        id: "c",
        label: "Compact it hard with the bucket and carry on. It's only a couple of metres in a long beam",
        quality: "poor",
        cost: 8500,
        days: 4,
        inspectionFail: true,
        outcome:
          "The certifier spotted the fill at inspection. The engineer ordered piers through it, after the steel was already in.",
      },
    ],
    why: "A slab is only as good as what it sits on. Uncontrolled fill settles, and AS 2870 only allows footings on fill in limited, controlled circumstances. When the ground isn't what the soil report assumed, stop and get the engineer's direction in writing. The answer is usually deeper beams, or piers down to natural ground.",
    refs: [
      "AS 2870 Residential slabs and footings: founding material and fill",
      "Engineer's drawings and the geotechnical report",
    ],
    units: ["CPCCCA3028", "CPCCCA3025"],
  },
  {
    id: "footings-trench-safety",
    stage: "footings",
    kind: "core",
    order: 30,
    title: "The deep trench",
    situation:
      "The sewer connection trench at the back of the block is 1.6 m deep in clay. The plumber's apprentice is about to jump in to connect at the junction. The trench walls are vertical and the spoil is piled right on the edge.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Stop the job until the trench is benched or shored, the spoil is moved back and there's a ladder in",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Trench benched and spoil pulled back within the hour. Connection made safely.",
      },
      {
        id: "b",
        label: "Let him in for the two minutes it takes, while you stand at the top and watch the walls for movement",
        quality: "partial",
        cost: 1500,
        days: 1,
        safety: true,
        outcome:
          "Nothing collapsed this time. A SafeWork inspector driving past issued an improvement notice for the unsupported trench.",
      },
      {
        id: "c",
        label: "It's stiff clay and it's been open all morning without moving. Let him get on with it",
        quality: "poor",
        cost: 6000,
        days: 3,
        safety: true,
        outcome:
          "A slab of the wall let go and buried the apprentice to the waist. He's okay, but SafeWork shut the site with a prohibition notice.",
      },
    ],
    why: "A cubic metre of soil weighs around a tonne and a half, and trench collapses kill. A trench 1.5 m or deeper is high-risk construction work: you need a SWMS, and the sides have to be benched, battered or shored unless a geotechnical engineer says in writing that they're safe. Keep spoil and machinery back from the edge and give people a safe way in and out.",
    refs: [
      "WHS Regulation 2017 (NSW): excavation work and trenches 1.5 m or deeper",
      "WHS Regulation 2017 (NSW): high-risk construction work and SWMS",
      "SafeWork NSW Code of Practice: Excavation work",
    ],
    units: ["CPCWHS3001", "CPCCWHS2001"],
  },
  {
    id: "footings-excavation-inspection",
    stage: "footings",
    kind: "core",
    order: 40,
    title: "Before anything goes in the trench",
    situation:
      "The beam trenches and pier holes are dug, clean and dry. The steel is being delivered tomorrow and the concreter wants to start placing reo and bar chairs first thing.",
    question: "What needs to happen before any steel or concrete goes in?",
    options: [
      {
        id: "a",
        label:
          "Book the certifier's footing inspection, and nothing goes in until the excavation is passed",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Excavation inspected and passed. Steel started the next morning.",
      },
      {
        id: "b",
        label: "Send the certifier dated photos of every trench with a tape in shot for scale, then keep going",
        quality: "partial",
        cost: 800,
        days: 2,
        outcome:
          "The certifier wouldn't accept photos for a critical stage inspection. Steel came back out so the trench bases could be seen.",
      },
      {
        id: "c",
        label: "Get the steel in now. The certifier can look at the trenches and the steel together before the pour",
        quality: "poor",
        cost: 3200,
        days: 3,
        inspectionFail: true,
        outcome:
          "The footing excavation inspection was missed. Steel and chairs were pulled out so the certifier could see the founding material.",
      },
    ],
    why: "In NSW the first critical stage inspection for a house comes after excavation for the footings and before any footing is placed. The certifier needs at least 48 hours' notice. They're checking depth, width and that you've reached the founding material the engineer assumed. Miss it, and you may be digging evidence back up to get an occupation certificate.",
    refs: [
      "EP&A (Development Certification and Fire Safety) Regulation 2021 (NSW): critical stage inspections",
      "AS 2870 Residential slabs and footings: footing excavations",
      "Engineer's drawings",
    ],
    units: ["CPCCCA3028", "CPCCOM1014"],
  },
  {
    id: "footings-underslab-plumbing",
    stage: "footings",
    kind: "core",
    order: 50,
    title: "Plumber before steel",
    situation:
      "The excavation has been passed. The steel fixer can start tomorrow, but the plumber is on another job until Thursday. The concreter says he can 'leave gaps' for the pipes.",
    question: "What's the right sequence?",
    options: [
      {
        id: "a",
        label:
          "Hold the steel until the plumber's drains are in, tested and inspected",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Drains in, tested and inspected. Membrane and steel went down clean over the top.",
      },
      {
        id: "b",
        label: "Let the steel fixer do the beams only, and leave the slab area clear for the plumber",
        quality: "partial",
        cost: 400,
        days: 1,
        outcome: "It mostly worked, but the plumber had to lift trench mesh in two spots to get his falls. Rework on both sides.",
      },
      {
        id: "c",
        label: "Lay the membrane and mesh now to stay on program. The plumber can cut his pipes in when he arrives",
        quality: "poor",
        cost: 4200,
        days: 3,
        outcome:
          "Membrane slashed and mesh cut to get the drains in. Steel and membrane were re-laid, and the drainage inspection was done on a mess.",
      },
    ],
    why: "Sequence matters: drainage first, then membrane, then steel. Under-slab sanitary drainage is laid to grade by a licensed plumber, then inspected and tested before it's covered. The pipe penetrations then get sealed to the membrane and fitted with termite collars. None of that can be done neatly through finished reo.",
    refs: [
      "AS/NZS 3500.2 Sanitary plumbing and drainage",
      "Plumbing and Drainage Act 2011 (NSW): inspection of drainage before it is covered",
      "AS 3660.1 Termite management: slab penetrations",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
  {
    id: "footings-fill",
    stage: "footings",
    kind: "site",
    order: 15,
    title: "Fill under the slab",
    when: (site) => site.fall >= 1,
    situation: (site) => {
      const fillDepth = Math.round((site.fall * 450) / 50) * 50;
      return `The block falls ${site.fall} m ${site.fallDirection}, so the house pad is cut on the high side and filled on the low side. The operator has pushed the cut material across and track-rolled it. Part of the slab will sit over about ${fillDepth} mm of that fill.`;
    },
    question: "What do you do about the fill?",
    options: [
      {
        id: "a",
        label:
          "Follow the engineer's drawings: fill compacted in layers and tested, or piered through",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Fill placed in layers to the engineer's note, with compaction results on file.",
      },
      {
        id: "b",
        label: "Run a plate compactor over the top until it stops sinking, then get the formwork straight on",
        quality: "partial",
        cost: 2500,
        days: 2,
        outcome:
          "The surface was hard but underneath wasn't. The engineer asked for compaction results, they failed, and the fill was reworked in layers.",
      },
      {
        id: "c",
        label: "Track-rolled is fine. The excavator weighs 20 tonnes, which is far more than the house will",
        quality: "poor",
        cost: 9500,
        days: 5,
        inspectionFail: true,
        outcome:
          "The certifier asked for the compaction certificate and there wasn't one. The engineer ordered bored piers through the fill to natural ground.",
      },
    ],
    why: "Loose fill settles and takes the slab with it. Under AS 2870 and the NCC, fill under a slab has to be placed and compacted in thin layers, no more than about 150 mm at a time for clay or 300 mm for sand, and only to limited depths. Deeper fill needs the engineer's specification and compaction testing, or the footings go through it to natural ground. Track-rolling one thick layer doesn't count.",
    refs: [
      "AS 2870 Residential slabs and footings: controlled fill and rolled fill",
      "ABCB Housing Provisions Section 4: filling under concrete slabs",
      "Engineer's drawings",
    ],
    units: ["CPCCCA3028", "CPCCCA3025"],
  },
  {
    id: "event-neighbour",
    stage: "footings",
    kind: "event",
    order: 5,
    weight: 1,
    title: "Early start, angry neighbour",
    situation:
      "Saturday, 6:15 am. The excavator contractor has started up early 'to beat the heat'. The neighbour is at the fence filming on her phone and says she's ringing the council.",
    question: "How do you respond?",
    options: [
      {
        id: "a",
        label:
          "Shut the machine down, apologise, and check the working hours in the consent",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Machine off, neighbour calmed down. The approved hours went up on the site board.",
      },
      {
        id: "b",
        label: "Ask the operator to idle down and work on the far side of the block, away from her house",
        quality: "partial",
        cost: 600,
        days: 0,
        outcome: "Still outside the permitted hours. The council ranger issued a warning and now drives past most mornings.",
      },
      {
        id: "c",
        label: "Tell her it's a building site, the noise won't last long, and keep going",
        quality: "poor",
        cost: 3000,
        days: 1,
        outcome:
          "Council issued a penalty notice for breaching the consent conditions. The neighbour now objects to everything, including your skip bin.",
      },
    ],
    why: "Working hours are a condition of the development consent or CDC. They typically start at 7 am on weekdays, with shorter hours on Saturday and no work on Sundays or public holidays, so check your own consent. Breaching them can bring fines and stop-work orders. A neighbour who's onside is worth far more than an hour's head start.",
    refs: [
      "Development consent or complying development conditions: hours of work",
      "Protection of the Environment Operations Act 1997 (NSW): noise",
    ],
    units: ["CPCCOM1014", "CPCCOM1012"],
  },
];
