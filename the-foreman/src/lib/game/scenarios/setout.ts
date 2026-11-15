import type { DecisionDef } from "./types";

export const SETOUT: DecisionDef[] = [
  {
    id: "setout-before-start",
    stage: "setout",
    kind: "core",
    order: 10,
    title: "Before the first peg",
    situation:
      "The excavator's booked for Monday and the client's keen to see dirt move. The approved plans are in the ute. The block is still a bare paddock: no fence, no sign, no sediment control.",
    question: "What has to be sorted before any work starts on site?",
    options: [
      {
        id: "a",
        label:
          "Get the approvals, insurance, fence, sign, toilet and sediment control sorted before any machine arrives",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "The site is legal and tidy from day one. No dramas.",
      },
      {
        id: "b",
        label: "Get the fence, toilet and sediment control in this week and sort the certifier paperwork once we're underway",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome:
          "The certifier pulled you up for starting without a notice of commencement. A day lost fixing the paperwork.",
      },
      {
        id: "c",
        label: "Let the excavator start Monday so the client sees progress. The set-up can happen around the earthworks",
        quality: "poor",
        cost: 3500,
        days: 2,
        outcome:
          "A council ranger found mud on the road and no sediment fence. On-the-spot fine, and a stop-work until the site was set up.",
      },
    ],
    why: "In NSW you can't start building work until a principal certifier is appointed and you've given at least two days' notice that you're starting. The site needs a sign with the certifier's and builder's details, a secure fence, a toilet, and erosion and sediment control in place before any earthworks. Home Building Compensation cover has to be in place before work starts on a job over $20,000.",
    refs: [
      "EP&A Act 1979 (NSW): appointing the principal certifier and notice of commencement",
      "Home Building Act 1989 (NSW): Home Building Compensation cover",
      "Development consent or CDC conditions: site sign, fencing, sediment control",
      "WHS Regulation 2017 (NSW): site security and amenities",
    ],
    units: ["CPCCWHS2001", "CPCCOM1012"],
  },
  {
    id: "setout-services",
    stage: "setout",
    kind: "core",
    order: 20,
    title: "Before you dig",
    situation:
      "The excavator operator is ready to strip the site and dig the sewer trench. The street has power, water, gas and NBN in the verge, and there's a sewer main somewhere along the back boundary.",
    question: "What do you do before the bucket hits the ground?",
    options: [
      {
        id: "a",
        label:
          "Lodge a Before You Dig enquiry, then pothole by hand to find the services before digging",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Services located and marked. The trench went in without touching anything.",
      },
      {
        id: "b",
        label: "Ask the neighbours and the operator where the services usually run, then dig slowly with a spotter watching",
        quality: "partial",
        cost: 1800,
        days: 1,
        outcome: "The operator clipped an unmarked water service. Plumber call-out and a muddy day lost.",
      },
      {
        id: "c",
        label: "The services are out in the street, not on the block, so there's nothing to hit. Just dig",
        quality: "poor",
        cost: 7500,
        days: 3,
        safety: true,
        outcome:
          "The bucket went through the NBN lead-in and nicked the gas service. Site evacuated, a repair bill from the asset owner, and SafeWork notified.",
      },
    ],
    why: "Underground services can kill you, and they're expensive to hit. A free Before You Dig Australia enquiry gets you the asset owners' plans. You then find the services by potholing with hand tools before a machine digs anywhere near them. Getting that information before excavation starts is a duty under the WHS Regulation, not a nice-to-have.",
    refs: [
      "WHS Regulation 2017 (NSW): excavation work and underground essential services information",
      "SafeWork NSW Code of Practice: Excavation work",
      "Before You Dig Australia (BYDA)",
    ],
    units: ["CPCWHS3001", "CPCCWHS2001"],
  },
  {
    id: "setout-boundaries",
    stage: "setout",
    kind: "core",
    order: 30,
    title: "Finding the boundaries",
    situation:
      "The plans show the house 900 mm off the side boundary. There's an old paling fence down that side, and the neighbour reckons 'the fence is the boundary'.",
    question: "How do you establish where the house goes?",
    options: [
      {
        id: "a",
        label: "Have a registered surveyor peg the boundaries, then work from their marks",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Surveyor's pegs in, setbacks confirmed. The house sits where the approval says.",
      },
      {
        id: "b",
        label: "Find the old survey pegs from when the estate was subdivided and measure the set-out off those",
        quality: "partial",
        cost: 500,
        days: 1,
        outcome:
          "One of the old pegs had been knocked. You picked it up at the check measure, but it cost a day getting the surveyor back.",
      },
      {
        id: "c",
        label: "Measure off the paling fence. It's been there for decades and both neighbours accept it",
        quality: "poor",
        cost: 9000,
        days: 5,
        outcome:
          "The fence was 300 mm off the true boundary. The survey at slab stage showed the house inside the side setback. Formwork ripped out and re-set.",
      },
    ],
    why: "Fences are rarely on the true boundary, and only a registered surveyor can define one. The certifier will want a survey showing the building sits where the approval says. The 900 mm matters too: an external wall closer than 900 mm to a boundary has to be fire-resisting under the NCC. Set out from the surveyor's marks before a single hole is dug.",
    refs: [
      "Approved plans and development consent: setbacks",
      "Surveying and Spatial Information Act 2002 (NSW): boundaries are defined by a registered surveyor",
      "NCC 2022 Volume Two Part H3 and ABCB Housing Provisions Part 9.2: fire separation of external walls within 900 mm of a boundary",
    ],
    units: ["CPCCCA3002", "CPCCCA3025"],
  },
  {
    id: "setout-square",
    stage: "setout",
    kind: "core",
    order: 40,
    title: "Squaring the set-out",
    situation:
      "You've strung the front building line between two profiles. Now you need to turn the corner and set the side wall line dead square before the rest of the profiles go in.",
    question: "How do you set the corner square and prove the whole set-out is right?",
    options: [
      {
        id: "a",
        label: "Turn the corner with a scaled-up 3-4-5 triangle, then check the diagonals are equal",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Diagonals within a couple of millimetres. The formworker had a square set-out to work from.",
      },
      {
        id: "b",
        label: "Set the corner with a big builder's square, then check each wall length against the plan",
        quality: "partial",
        cost: 400,
        days: 1,
        outcome:
          "A small square gives a big error over 18 m. The diagonal check later showed 25 mm out, and the profiles were re-set.",
      },
      {
        id: "c",
        label: "Run the side line parallel to the fence with a tape at each end. The fence is straight enough",
        quality: "poor",
        cost: 2500,
        days: 2,
        outcome:
          "The formworker's diagonals were 60 mm out. Profiles pulled and re-set, and the formworker charged for the lost day.",
      },
    ],
    why: "A 3-4-5 triangle gives a true right angle. Scale it up to 6-8-10 m so any error stays small over a long wall. Then measure both diagonals of the rectangle: if they're equal, it's square. Check the overall sizes against the plan before anyone digs. A set-out that's out of square follows you all the way to the roof.",
    refs: [
      "Approved plans: overall and wall dimensions",
      "Setting-out practice: 3-4-5 method and equal diagonals (CPCCCA3002)",
    ],
    units: ["CPCCCA3002", "CPCCOM1015"],
  },
  {
    id: "setout-levels",
    stage: "setout",
    kind: "core",
    order: 50,
    title: "Setting the floor level",
    situation: (site) =>
      `The plans nominate a finished floor level, and the surveyor has left a temporary bench mark on the kerb. The block falls about ${site.fall} m ${site.fallDirection}. You need to mark the slab height on the profiles.`,
    question: "How do you set the floor level?",
    options: [
      {
        id: "a",
        label:
          "Take a level reading on the bench mark, transfer it to every profile, then check back on the bench mark",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Levels closed back on the bench mark. Slab height matches the approved floor level.",
      },
      {
        id: "b",
        label: "Shoot the level from the bench mark to the first profile, then run a tight string line from that to the rest",
        quality: "partial",
        cost: 300,
        days: 1,
        outcome: "A sagging string line put the far corner 15 mm low. The formworker picked it up and the levels were re-shot.",
      },
      {
        id: "c",
        label: "Set the slab height off the natural ground at the highest corner. About 150 mm up will clear the dirt",
        quality: "poor",
        cost: 4000,
        days: 3,
        outcome:
          "The slab height didn't match the approved floor level. The certifier wanted levels confirmed by survey, and the formwork was lifted and re-set.",
      },
    ],
    why: "Floor level comes from the approved plans, not from the dirt. Take a backsight on the bench mark and transfer that level to every profile with the instrument. Closing back on the bench mark proves nothing has moved. The slab then has to finish at least 150 mm above the finished ground around it, so surface water drains away from the house.",
    refs: [
      "Approved plans: finished floor level and reduced levels",
      "ABCB Housing Provisions Part 3.3: slab height above finished ground (150 mm generally) and surface drainage",
    ],
    units: ["CPCCCM2006", "CPCCOM3006", "CPCCCA3002"],
  },
  {
    id: "event-asbestos",
    stage: "setout",
    kind: "event",
    order: 25,
    weight: 1,
    title: "Fibro in the site scrape",
    situation:
      "The excavator is stripping topsoil when the operator spots broken pieces of old fibro sheet through the fill near the back fence. It looks like a demolished shed was buried there.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Stop work there, keep people away, and bring in a licensed asbestos removalist to test and clear it",
        quality: "good",
        cost: 600,
        days: 2,
        outcome: "Licensed removal and a clearance certificate, handled as a variation. Two days lost while the area was cleared.",
      },
      {
        id: "b",
        label: "Wet it down and get the labourer to pick the pieces out by hand into a skip, wearing a dust mask and gloves",
        quality: "partial",
        cost: 2500,
        days: 2,
        safety: true,
        outcome: "The tip rejected the skip as contaminated. Licensed removal was needed anyway, plus contaminated-load fees.",
      },
      {
        id: "c",
        label: "Keep stripping and blend it in. It's only a few bits and it'll end up sealed under the slab anyway",
        quality: "poor",
        cost: 12000,
        days: 6,
        safety: true,
        outcome:
          "The soil carter reported the contaminated load. SafeWork and the EPA attended, the site was shut, and a consultant had to remediate and validate the whole pad.",
      },
    ],
    why: "Old fibro very likely contains asbestos, and breaking it up releases fibres that cause incurable lung disease. If you find it: stop, keep people out, don't disturb it, and treat it as asbestos until a test says otherwise. Removal and disposal is licensed work with a clearance at the end, and contaminated soil can't go to an ordinary tip.",
    refs: [
      "WHS Regulation 2017 (NSW): asbestos identification, licensed removal and clearance",
      "SafeWork NSW Code of Practice: How to safely remove asbestos",
      "Protection of the Environment Operations Act 1997 (NSW): waste disposal",
    ],
    units: ["CPCWHS3001", "CPCCWHS2001"],
  },
];
