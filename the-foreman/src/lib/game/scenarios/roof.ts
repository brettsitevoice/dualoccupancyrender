import type { DecisionDef } from "./types";

export const ROOF: DecisionDef[] = [
  {
    id: "roof-truss-damage",
    stage: "roof",
    kind: "core",
    order: 10,
    title: "A cracked truss",
    situation:
      "The trusses are delivered. Checking them off, you find one standard truss with a cracked bottom chord near a nail plate. It looks like forklift damage. The crane is booked for 7 am tomorrow.",
    question: "What do you do with it?",
    options: [
      {
        id: "a",
        label:
          "Set it aside and get a replacement or a written repair detail from the manufacturer",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Manufacturer sent a replacement on the morning run. It went up with the rest.",
      },
      {
        id: "b",
        label: "Install it with the others and get the manufacturer to look at it once the roof is on",
        quality: "partial",
        cost: 1400,
        days: 1,
        outcome: "The manufacturer wanted it replaced. With battens on, swapping it took a day and a second crane visit.",
      },
      {
        id: "c",
        label: "Nail and glue a length of 90 x 45 down each side of the crack, then stand it with the rest",
        quality: "poor",
        cost: 4500,
        days: 2,
        inspectionFail: true,
        outcome:
          "The certifier spotted the site repair and asked for the manufacturer's detail. There wasn't one. Part of the roof was stripped to replace the truss.",
      },
    ],
    why: "A truss is an engineered component. Every chord, web and nail plate is doing a calculated job. AS 4440 says a damaged truss can't be installed or repaired without a detail from the manufacturer or an engineer, and you never cut, drill or notch one. Check trusses against the layout on delivery, so problems are found before the crane arrives.",
    refs: [
      "AS 4440 Installation of nailplated timber roof trusses: damaged trusses and modifications",
      "Truss manufacturer's layout and documentation",
    ],
    units: ["CPCCCA3006", "CPCCCA2011"],
  },
  {
    id: "roof-truss-erection",
    stage: "roof",
    kind: "core",
    order: 20,
    title: "Standing the trusses",
    situation:
      "The first trusses are going up. The crew plans to stand all of them with a single line of batten holding the tops, then come back at the end to plumb them and fit the bracing and ties.",
    question: "What's the right way to run it?",
    options: [
      {
        id: "a",
        label:
          "Plumb and brace the first truss, tie each one as it's stood, and brace before loading",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Trusses plumb, straight and braced to the manufacturer's layout before any roofing was loaded.",
      },
      {
        id: "b",
        label: "Stand them all while the crane is here, then plumb and brace them before the roofers start",
        quality: "partial",
        cost: 800,
        days: 1,
        outcome: "The trusses leaned in the breeze overnight. A few were 40 mm out of plumb and a day went on pulling them back.",
      },
      {
        id: "c",
        label: "One batten line is enough. Let the roofers load the roof and it'll all lock together",
        quality: "poor",
        cost: 9000,
        days: 5,
        safety: true,
        outcome:
          "With roofing loaded on unbraced trusses, the whole run fell sideways like dominoes. Nobody was underneath. Trusses re-supplied.",
      },
    ],
    why: "Trusses are strong in their own plane and floppy sideways. AS 4440 has you plumb and brace the first truss solidly, tie each one at the right spacing as it goes up, and fit the permanent bracing and ties before the roof is loaded. The tolerances are tight: out of plumb by no more than height over 50, and bow by no more than length over 200, each capped at 50 mm. Unbraced trusses fall like dominoes.",
    refs: [
      "AS 4440 Installation of nailplated timber roof trusses: erection, temporary bracing and tolerances",
      "Truss manufacturer's bracing layout",
    ],
    units: ["CPCCCA3006", "CPCCCM2012"],
  },
  {
    id: "roof-height-safety",
    stage: "roof",
    kind: "core",
    order: 30,
    title: "Before anyone goes up",
    situation: (site) =>
      `The roofers arrive to ${site.roof === "metal sheet" ? "sheet" : "tile"} the roof. The eaves are about 2.7 m off the ground. There's no scaffold or edge protection up. The lead roofer says, 'We'll be quick. Two of us have harnesses in the ute.'`,
    question: "What's required before they go up?",
    options: [
      {
        id: "a",
        label:
          "Edge protection or scaffold goes up first, with a SWMS. Harnesses are a last resort",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Guardrail went up that morning as planned. Roof on with no incidents.",
      },
      {
        id: "b",
        label: "Let them work in harnesses anchored to the trusses for today, while you organise the scaffold",
        quality: "partial",
        cost: 1200,
        days: 1,
        safety: true,
        outcome:
          "A SafeWork inspector stopped in: no rated anchor point, no rescue plan, no SWMS. Improvement notice and a day lost while the guardrail went up.",
      },
      {
        id: "c",
        label: "They're experienced roofers and it's a single-storey roof on a calm day. Let them get on with it",
        quality: "poor",
        cost: 8000,
        days: 3,
        safety: true,
        outcome:
          "A roofer slipped on the sarking and went off the edge: broken wrist and ribs. Prohibition notice, investigation and on-the-spot fines.",
      },
    ],
    why: "Falls from roofs are the biggest killer in housing construction. Where someone could fall more than 2 m it's high-risk construction work, so you need a SWMS, and you control the risk in order: work from the ground or a solid platform first, then edge protection or scaffold, with a harness only as the last resort. A harness also needs a rated anchor and a rescue plan. SafeWork fines on the spot for unprotected roof edges.",
    refs: [
      "WHS Regulation 2017 (NSW): managing the risk of falls; high-risk construction work (fall of more than 2 m)",
      "SafeWork NSW Code of Practice: Managing the risk of falls in housing construction",
      "AS/NZS 4994 Temporary edge protection",
    ],
    units: ["CPCCCM2012", "CPCWHS3001", "CPCCCM2008"],
  },
  {
    id: "roof-metal-fixing",
    stage: "roof",
    kind: "core",
    order: 40,
    title: "Fixing the sheets",
    when: (site) => site.roof === "metal sheet",
    situation: (site) =>
      `The roof is corrugated metal at ${site.roofPitch}° in an ${site.windClass} wind area${site.coastKm !== null && site.coastKm <= 1 ? ", close to the surf" : ""}. The roofer has a box of screws left over from his last job and plans to fix 'every second corrugation at the ends and every fourth in the middle, like always'.`,
    question: "How do you make sure the roof fixing is right?",
    options: [
      {
        id: "a",
        label:
          "Check the profile suits the pitch, then fix to the manufacturer's tables for this wind class",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Sheets fixed to the manufacturer's tables, with closer fixings at the edges and ridge.",
      },
      {
        id: "b",
        label: "Tell him to forget the pattern and put a screw in every corrugation across the whole roof to be safe",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome:
          "More screws, but the wrong ones, and the battens were still only nominally fixed to the trusses. The roofer came back to re-fix the edge zones.",
      },
      {
        id: "c",
        label: "He's the licensed roofer and he's done hundreds of these. Leave the fixing to him",
        quality: "poor",
        cost: 5200,
        days: 2,
        outcome:
          "The first storm peeled three sheets back along the gable edge. Water through the ceiling insulation, and the manufacturer wouldn't warrant the roof.",
      },
    ],
    why: "Wind suction is strongest at the edges, ridges and corners of a roof, so the fixings are closer there. The sheet manufacturer publishes fixing tables for each profile and wind class, backed by AS 1562.1, and each profile has a minimum pitch. The battens have to be tied down to the trusses to match. Near the coast, the screws need a higher corrosion class as well.",
    refs: [
      "AS 1562.1 Design and installation of sheet roof and wall cladding: metal",
      "ABCB Housing Provisions Section 7: sheet roofing",
      "Manufacturer's installation manual: fixing tables by wind class",
      "AS 3566 Self-drilling screws: corrosion resistance classes",
    ],
    units: ["CPCCCA3007", "CPCCCA3025"],
  },
  {
    id: "roof-tile-sarking",
    stage: "roof",
    kind: "core",
    order: 40,
    title: "To sark or not",
    when: (site) => site.roof === "concrete tile",
    situation: (site) =>
      `The roof is concrete tile at ${site.roofPitch}° pitch with rafter lengths up to 6.5 m${site.bal !== "BAL-LOW" ? `, on a ${site.bal} site` : ""}. The tiler says, 'We can skip the sarking and save you a few grand. Tiles keep the water out.'`,
    question: "Do you sark the roof?",
    options: [
      {
        id: "a",
        label:
          "Yes. This roof needs sarking under the tiles, lapped and supported at the eaves",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Roof sarked and lapped, with anti-ponding boards at the eaves, before the battens went on.",
      },
      {
        id: "b",
        label: "Sark the lower half of each roof plane, where most of the water runs, and save on the rest",
        quality: "partial",
        cost: 1500,
        days: 1,
        outcome: "A half-sarked roof isn't compliant. Tiles were lifted to sark the rest.",
      },
      {
        id: "c",
        label: "Skip it. Tiled roofs went without sarking for a hundred years, so save the money",
        quality: "poor",
        cost: 6500,
        days: 3,
        outcome:
          "The first wind-driven rain came through the tile laps onto the new ceilings. Tiles lifted, sarking laid, plasterboard replaced.",
      },
    ],
    why: "Tiles shed water, but wind-driven rain and dust get through the laps. The NCC and AS 2050 require sarking under tiles once the rafters get long for the pitch. At 20° that's anything over about 5.5 m. AS 3959 also requires it in bushfire-prone areas, to keep embers out. The sarking needs support at the eaves so water runs into the gutter and not behind the fascia.",
    refs: [
      "AS 2050 Installation of roof tiles",
      "ABCB Housing Provisions Section 7: roof tiles and sarking",
      "AS 3959 Construction of buildings in bushfire-prone areas: roof sarking",
    ],
    units: ["CPCCCA3007", "CPCCCA3025"],
  },
  {
    id: "roof-gutters",
    stage: "roof",
    kind: "core",
    order: 50,
    title: "Gutters and downpipes",
    situation:
      "Fascia and gutter are going on. The plans show six downpipes. The plumber says he can 'make it work with four', and wants to run the eaves gutter dead level so it looks neat against the fascia.",
    question: "What do you require?",
    options: [
      {
        id: "a",
        label:
          "Six downpipes as designed, gutters laid to fall, and an overflow provision",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Six downpipes, gutters falling to each one, with overflow slots in the gutter front.",
      },
      {
        id: "b",
        label: "Keep the six downpipes, but run the gutters level. They look better and still drain",
        quality: "partial",
        cost: 700,
        days: 1,
        outcome: "Level gutters pond and rust out. The brackets were re-set to fall.",
      },
      {
        id: "c",
        label: "Four is fine if he says so. He's the licensed plumber and roof drainage is his call",
        quality: "poor",
        cost: 4800,
        days: 2,
        outcome:
          "In the first storm the gutter overflowed backwards into the eaves and down the wall cavity. Extra downpipes cut in, eaves linings replaced.",
      },
    ],
    why: "Roof drainage is designed, not guessed. The NCC limits each downpipe to 12 m of gutter and wants downpipes close to valleys, where the water concentrates. Eaves gutters need a fall of at least 1 in 500 and a way to overflow outwards, so a blockage doesn't push water back into the building. Roof plumbing is licensed work under AS/NZS 3500.3.",
    refs: [
      "ABCB Housing Provisions Section 7: gutters and downpipes (12 m of gutter per downpipe, 1:500 fall, overflow)",
      "AS/NZS 3500.3 Stormwater drainage",
      "Approved plans: roof drainage layout",
    ],
    units: ["CPCCCA3008", "CPCCCA3025"],
  },
  {
    id: "event-crane-powerlines",
    stage: "roof",
    kind: "event",
    order: 15,
    weight: 1,
    title: "Crane under the power lines",
    situation:
      "The crane truck arrives to lift the trusses. The only spot to set up is on the street, directly under the overhead power lines along the front of the block. The operator says, 'I'll keep the boom low. Should be right.'",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Stop the lift. Set up outside the approach distance or call the network operator first",
        quality: "good",
        cost: 500,
        days: 1,
        outcome: "Lift re-planned from the driveway with a spotter. A day lost and a re-booking fee, and everyone went home.",
      },
      {
        id: "b",
        label: "Go ahead with the boom kept low and a spotter on the ground watching the gap to the lines",
        quality: "partial",
        cost: 1200,
        days: 1,
        safety: true,
        outcome: "SafeWork happened past: plant inside the approach distance with no safe system of work. Lift stopped, improvement notice.",
      },
      {
        id: "c",
        label: "Trust the operator. He does this every day and it's his ticket on the line",
        quality: "poor",
        cost: 15000,
        days: 6,
        safety: true,
        outcome:
          "The boom arced to the high-voltage line. The operator survived with burns, the street lost power and the site was shut for the investigation.",
      },
    ],
    why: "You don't have to touch a power line to be killed. Electricity can jump the gap. The WHS Regulation requires that no person, plant or load comes within an unsafe distance of overhead lines, and SafeWork's code sets the approach distances: as a rule, keep cranes and loads at least 3 m from ordinary street lines, and more for higher voltages. If you can't, talk to the network operator before the lift, not after.",
    refs: [
      "WHS Regulation 2017 (NSW): overhead and underground electric lines",
      "SafeWork NSW Code of Practice: Work near overhead power lines",
    ],
    units: ["CPCWHS3001", "CPCCCA3006"],
  },
  {
    id: "event-heatwave",
    stage: "roof",
    kind: "event",
    order: 45,
    weight: 1,
    title: "Forty-one degrees",
    situation:
      "The forecast is 41 °C and humid. The roofing crew wants to push on and finish the last roof plane. They're already behind after last week.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Start at first light, stop roof work before the peak heat, with shade, water and breaks",
        quality: "good",
        cost: 0,
        days: 1,
        outcome: "Crew worked 5:30 to 11 and finished the plane the next morning. One day lost to the weather.",
      },
      {
        id: "b",
        label: "Let them work through, but hand out cold water and sunscreen and tell them to take it easy",
        quality: "partial",
        cost: 600,
        days: 1,
        safety: true,
        outcome: "By 1 pm one roofer was dizzy and cramping and was sent home. The afternoon was lost anyway.",
      },
      {
        id: "c",
        label: "The program's behind and they want to finish. Let them push through",
        quality: "poor",
        cost: 5000,
        days: 3,
        safety: true,
        outcome:
          "A roofer collapsed with heat stroke on the roof and had to be brought down by Fire and Rescue. Hospital, SafeWork investigation, site shut.",
      },
    ],
    why: "Heat stroke kills, and a roof is the hottest place on site. There's no single stop-work temperature in the WHS laws. The duty is to manage the risk: move hot work to the cool of the day, provide shade, cool drinking water and rest breaks, watch each other for symptoms, and stop when it can't be done safely. A day lost to weather is a normal part of a program.",
    refs: [
      "WHS Act 2011 (NSW): primary duty of care",
      "SafeWork NSW Code of Practice: Managing the work environment and facilities",
    ],
    units: ["CPCWHS3001", "CPCCWHS2001"],
  },
];
