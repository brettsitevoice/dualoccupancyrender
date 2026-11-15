import type { DecisionDef } from "./types";

export const FITOFF: DecisionDef[] = [
  {
    id: "fitoff-notched-studs",
    stage: "fitoff",
    kind: "core",
    order: 10,
    title: "Notched studs",
    situation:
      "Walking the rough-in, you find the plumber has notched 45 mm out of three 90 mm load-bearing studs in a row, to run a waste pipe across the laundry wall.",
    question: "What's the fix?",
    options: [
      {
        id: "a",
        label:
          "Before lining, re-route the pipe or replace the studs to an engineer's detail",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Plumber re-ran the waste through the floor zone at his cost and the three studs were replaced.",
      },
      {
        id: "b",
        label: "Screw a steel plate over each notch to strengthen the stud and protect the pipe, then move on",
        quality: "partial",
        cost: 800,
        days: 1,
        outcome:
          "Protection plates stop screws hitting the pipe. They don't put strength back. The certifier listed the studs for replacement.",
      },
      {
        id: "c",
        label: "It's a short wall with plenty of other studs, and it's inside the lining. Sheet over it",
        quality: "poor",
        cost: 5200,
        days: 3,
        inspectionFail: true,
        outcome:
          "Frame inspection failed on the notched studs. Pipework stripped out, studs replaced, plumber back to re-run the waste.",
      },
    ],
    why: "A stud is a column. Cut half of it away and it can buckle under the roof load. AS 1684 only allows small holes and shallow notches in studs, well spaced, and a 45 mm notch in a 90 mm stud is far past that. The pipe gets re-routed, or the studs get replaced or strengthened to an engineer's detail. Sort it at rough-in, while you can still see it.",
    refs: [
      "AS 1684.2 Section 6: notching, trenching and drilling of studs and plates",
      "AS/NZS 3500 Plumbing and drainage: installation in framed walls",
    ],
    units: ["CPCCCA3004", "CPCCCA3012"],
  },
  {
    id: "fitoff-prelining",
    stage: "fitoff",
    kind: "core",
    order: 20,
    title: "Before the walls are closed",
    situation:
      "Rough-in is done: plumbing, electrical and data. The insulation installer is booked for tomorrow and the plasterers for the day after. The certifier still hasn't passed the frame.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Hold the insulation and plasterboard until the certifier has passed the frame",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Frame inspected and passed with everything visible. Insulation started the following day.",
      },
      {
        id: "b",
        label: "Let the insulation go in, but hold the plasterboard until the inspection",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome:
          "The certifier couldn't see the bracing nailing or tie-down straps behind the batts. Batts came out of the bracing walls for the inspection.",
      },
      {
        id: "c",
        label: "Keep the trades moving. The certifier can inspect from the roof space and photos",
        quality: "poor",
        cost: 6500,
        days: 4,
        inspectionFail: true,
        outcome:
          "Missed critical stage inspection. The certifier required sheets off every bracing wall and tie-down point before signing off.",
      },
    ],
    why: "Before the framework of any wall, floor or roof is covered, the principal certifier has to inspect it. That's a critical stage inspection in NSW, and insulation and plasterboard both count as covering. Have the frame, bracing, tie-down and rough-in finished, book with 48 hours' notice, and schedule the insulation for after the pass.",
    refs: [
      "EP&A (Development Certification and Fire Safety) Regulation 2021 (NSW): critical stage inspections (framework before covering)",
      "AS 1684.2: bracing and tie-down",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
    excludes: ["event-certifier-defect"],
  },
  {
    id: "fitoff-waterproofing",
    stage: "fitoff",
    kind: "core",
    order: 40,
    title: "The tiler's in a hurry",
    situation:
      "The ensuite and bathroom were waterproofed yesterday afternoon. The tiler is on site this morning with his gear: 'The membrane's dry to touch. I'll have the floors tiled by lunch.' The certifier hasn't seen the waterproofing.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "No tiling until the membrane has cured and the certifier has inspected it",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Membrane cured, inspected and certified. The tiler started two days later on a sound base.",
      },
      {
        id: "b",
        label: "Let him tile the shower walls today, and leave the floors bare for the inspection",
        quality: "partial",
        cost: 700,
        days: 1,
        outcome:
          "The shower walls are part of the waterproofed area. The certifier wanted to see the wall and floor junctions, and the bottom rows of tiles came off.",
      },
      {
        id: "c",
        label: "Let him go. It's dry to touch, and you've got photos of the membrane for the certifier",
        quality: "poor",
        cost: 8500,
        days: 5,
        inspectionFail: true,
        outcome:
          "Missed critical stage inspection, and the membrane hadn't cured: it tore under the tile bed. Both bathrooms stripped back and redone.",
      },
    ],
    why: "Leaking showers are among the most common defects in new homes. Wet areas are waterproofed to AS 3740 and the NCC: the shower floor and walls, the junctions, the penetrations and the waterstop at the door. The membrane has to fully cure, which means the manufacturer's time, not dry to touch. In NSW the certifier inspects wet-area waterproofing before it's covered, and the waterproofer's certificate goes in your handover file.",
    refs: [
      "AS 3740 Waterproofing of domestic wet areas",
      "ABCB Housing Provisions Part 10.2: wet area waterproofing",
      "EP&A (Development Certification and Fire Safety) Regulation 2021 (NSW): critical stage inspections (wet area waterproofing)",
    ],
    units: ["CPCCCA3012", "CPCCCA3025"],
  },
  {
    id: "fitoff-sequence",
    stage: "fitoff",
    kind: "core",
    order: 50,
    title: "Who goes first",
    situation:
      "The plasterboard is set and sanded. This week the fix-out carpenter, the painter, the tiler, the cabinetmaker and the floor-covering installer are all asking when they can start.",
    question: "What order do you run them in?",
    options: [
      {
        id: "a",
        label:
          "Tiling, then cabinets and fix-out, then paint, then fit-off, with floor coverings last",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Each trade finished onto work that was ready for it. One coat of touch-up at the end.",
      },
      {
        id: "b",
        label: "Painter first while the house is empty, then carpentry, cabinets and tiling, with touch-ups at the end",
        quality: "partial",
        cost: 1500,
        days: 2,
        outcome: "It works, but everything around the new joinery and tiles got painted twice. An extra painter's visit.",
      },
      {
        id: "c",
        label: "Floor coverings first to get them done, then everyone else works over the top",
        quality: "poor",
        cost: 6000,
        days: 3,
        outcome: "New carpet and flooring wrecked by paint, tile slurry and boots. Flooring replaced in three rooms.",
      },
    ],
    why: "Sequence is about each trade finishing onto a surface that's ready, without wrecking the work before it. Wet trades go before dry finishes. Fixed joinery goes in before final paint, so the gaps get filled and painted once. Electrical and plumbing fit-off goes onto finished surfaces, and floor coverings go last onto a clean, dry slab. Get it wrong and you pay for the same work twice.",
    refs: [
      "Correct build sequence for internal finishes (trade practice)",
      "AS/NZS 2589 Gypsum linings: application and finishing",
      "Manufacturers' requirements for floor coverings",
    ],
    units: ["CPCCCA3024", "CPCCCA3025", "CPCCOM1012"],
  },
  {
    id: "fitoff-exhaust",
    stage: "fitoff",
    kind: "core",
    order: 30,
    title: "Fans into the roof space",
    situation:
      "In the roof space you find the bathroom and laundry exhaust fans blowing straight into the ceiling void with no ducting. The electrician says, 'That's how we've always done it. The roof space is ventilated.'",
    question: "What do you require?",
    options: [
      {
        id: "a",
        label: "Duct each fan to the outside air, through the eave or the roof",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Each fan ducted to an eave outlet before the insulation went down.",
      },
      {
        id: "b",
        label: "Add a couple of extra eave vents and a whirlybird so the roof space breathes more",
        quality: "partial",
        cost: 900,
        days: 1,
        outcome: "More vents don't meet the requirement. Ducting to outside was fitted anyway, after the insulation was already down.",
      },
      {
        id: "c",
        label: "Leave it. It's been done that way for years and the roof space has vents",
        quality: "poor",
        cost: 4200,
        days: 2,
        inspectionFail: true,
        outcome:
          "Final inspection failed: exhausts not discharging to outdoor air. Ducts and outlets retrofitted through finished eaves.",
      },
    ],
    why: "A shower puts litres of water vapour into the air. Dump that into the roof space and it condenses on the cold underside of the roof: mould, soggy insulation and rusted fixings. Under NCC 2022, exhaust from bathrooms, laundries and kitchens has to discharge to outdoor air, directly or through a duct, at minimum flow rates of 25 litres a second for a bathroom and 40 for a kitchen or laundry.",
    refs: [
      "NCC 2022 Volume Two Part H4: condensation management",
      "ABCB Housing Provisions Part 10.8: exhaust systems discharging to outdoor air, and flow rates",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
  {
    id: "fitoff-smoke-alarms",
    stage: "fitoff",
    kind: "core",
    order: 60,
    title: "Smoke alarms",
    situation:
      "The electrician's fit-off list shows one battery-powered smoke alarm in the hallway. The house has three bedrooms off a hallway at one end, and the main bedroom off the living area at the other.",
    question: "What should be installed?",
    options: [
      {
        id: "a",
        label:
          "Mains-powered, interconnected alarms between each group of bedrooms and the living areas",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Two hard-wired, interconnected alarms fitted with the rest of the electrical fit-off.",
      },
      {
        id: "b",
        label: "Two ten-year battery alarms: one in the hallway and one outside the main bedroom at the other end",
        quality: "partial",
        cost: 500,
        days: 0,
        outcome: "Right spots, wrong alarms. The electrician came back to hard-wire and interconnect them before the final.",
      },
      {
        id: "c",
        label: "One alarm in the hallway is enough for a single-storey house of this size",
        quality: "poor",
        cost: 2600,
        days: 2,
        inspectionFail: true,
        outcome:
          "Final inspection failed on smoke alarms. Cable pulled through finished ceilings to hard-wire and interconnect two alarms.",
      },
    ],
    why: "Smoke alarms buy sleeping people time to get out. The NCC requires alarms that comply with AS 3786, powered from the mains with a battery backup, in every hallway serving bedrooms, or between the bedrooms and the rest of the house. Where there's more than one, they must be interconnected so that one going off sets them all off.",
    refs: [
      "NCC 2022 Volume Two Part H3: smoke alarms",
      "ABCB Housing Provisions Part 9.5: smoke alarms",
      "AS 3786 Smoke alarms",
    ],
    units: ["CPCCCA3025", "CPCCWHS2001"],
  },
  {
    id: "fitoff-engineered-stone",
    stage: "fitoff",
    kind: "core",
    order: 55,
    title: "The benchtop request",
    situation:
      "The client wants an engineered stone benchtop instead of the laminate in the contract. The cabinetmaker says he's got an old slab at the factory he could cut on site to save time.",
    question: "What do you say?",
    options: [
      {
        id: "a",
        label:
          "No. Engineered stone is banned. Offer a compliant benchtop as a written variation",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Client chose a porcelain top as a signed variation. Cut and polished off site.",
      },
      {
        id: "b",
        label: "Agree to it, as long as he cuts it wet and outside, wearing a properly fitted respirator",
        quality: "partial",
        cost: 2000,
        days: 2,
        safety: true,
        outcome: "It's prohibited no matter how it's cut. The order was refused, the benchtop re-selected and the kitchen delayed.",
      },
      {
        id: "c",
        label: "The client's paying and it's only one benchtop. Let him cut it on site",
        quality: "poor",
        cost: 9000,
        days: 4,
        safety: true,
        outcome:
          "A neighbour reported the dust cloud. SafeWork issued a prohibition notice and fines for working with a prohibited product.",
      },
    ],
    why: "Engineered stone dust has caused an epidemic of silicosis in stone workers. It's an incurable lung disease. Manufacturing, supplying, processing and installing engineered stone benchtops, panels and slabs has been prohibited across Australia since 1 July 2024. For other materials with silica in them, like concrete, bricks and tiles, uncontrolled dry cutting is banned too: use water, on-tool extraction and the right respirator.",
    refs: [
      "WHS Regulation 2017 (NSW): prohibition on engineered stone from 1 July 2024",
      "WHS Regulation 2017 (NSW): processing materials containing crystalline silica",
      "Home Building Act 1989 (NSW): contract variations in writing",
    ],
    units: ["CPCCWHS2001", "CPCWHS3001"],
  },
  {
    id: "event-certifier-defect",
    stage: "fitoff",
    kind: "event",
    order: 20,
    weight: 3,
    title: "Defect found by the certifier",
    situation:
      "The certifier's frame inspection report lands: FAILED. Two bracing panels are nailed at 300 mm centres around the edges instead of 150 mm, and one girder truss is missing its tie-down strap. The plasterer is booked for tomorrow.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Push the trades back, fix every item, and get it re-inspected before it's covered",
        quality: "good",
        cost: 350,
        days: 1,
        outcome: "Defects fixed that afternoon and re-inspected two days later. A re-inspection fee and one day lost.",
      },
      {
        id: "b",
        label: "Fix the items today and send the certifier photos, so the plasterer can start tomorrow",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome:
          "The certifier wouldn't clear a failed critical stage inspection on photos alone. The plasterers stood down until the re-inspection.",
      },
      {
        id: "c",
        label: "Let the plasterer start in the rooms without defects, and fix the listed items as you go",
        quality: "poor",
        cost: 5800,
        days: 4,
        inspectionFail: true,
        outcome:
          "Sheets went up over a wall with a listed defect. The certifier had the linings removed and issued a written directions notice, which also goes to the owner.",
      },
    ],
    why: "A failed inspection isn't a disaster. Covering it up is. Fix each item to the standard the report cites, keep the evidence, and get the certifier back before the frame is covered. They need 48 hours' notice, so tell the following trades straight away. In NSW a certifier can issue a written directions notice for non-compliant work, and a copy goes to the owner.",
    refs: [
      "EP&A Act 1979 (NSW): critical stage inspections and written directions notices",
      "AS 1684.2 Section 8: fixing of bracing",
      "Certifier's inspection report",
    ],
    units: ["CPCCOM1014", "CPCCCA3004"],
    excludes: ["fitoff-prelining"],
  },
  {
    id: "event-leak-test",
    stage: "fitoff",
    kind: "event",
    order: 15,
    weight: 1,
    title: "The gauge is dropping",
    situation:
      "Before the plasterboard goes on, the plumber's pressure test on the water pipes won't hold. The gauge drops slowly. He can't find the leak and says, 'It's tiny. It'll seal itself. Sheet it.'",
    question: "What's your call?",
    options: [
      {
        id: "a",
        label: "No lining until the leak is found and fixed and the pipes hold the test pressure",
        quality: "good",
        cost: 0,
        days: 1,
        outcome: "The plumber found a half-crimped fitting behind the kitchen. Re-tested and held. One day lost.",
      },
      {
        id: "b",
        label: "Sheet everything except the wet-area walls, where the fittings are, so he can keep looking",
        quality: "partial",
        cost: 900,
        days: 1,
        outcome: "The leak was at a fitting behind the kitchen, already sheeted. One wall of plasterboard was cut out and replaced.",
      },
      {
        id: "c",
        label: "Sheet it. He's the licensed plumber, and a weep that small will seal itself",
        quality: "poor",
        cost: 9000,
        days: 4,
        outcome:
          "Three weeks after handover the hallway carpet is wet. A slow leak inside the wall: mould, swollen skirtings and bottom plates, and an insurance claim.",
      },
    ],
    why: "Water pipes are pressure tested at rough-in so that leaks are found while the pipes are still visible. AS/NZS 3500.1 requires the system to hold its test pressure, 1500 kPa for at least 30 minutes, without leaking. A dropping gauge means a leak. It never fixes itself, and a slow leak inside a wall does more damage than a burst.",
    refs: [
      "AS/NZS 3500.1 Water services: testing (1500 kPa for 30 minutes)",
      "Plumbing Code of Australia (NCC Volume Three)",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
];
