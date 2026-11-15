import type { DecisionDef } from "./types";

export const SLAB: DecisionDef[] = [
  {
    id: "slab-membrane",
    stage: "slab",
    kind: "core",
    order: 10,
    title: "The plastic under the slab",
    situation:
      "Formwork is up and the sand bed is screeded. The labourer has rolled out the plastic membrane. The sheets are butted edge to edge, there are a few tears from the wheelbarrow, and the plastic stops short at the pipe penetrations.",
    question: "What do you get fixed before the steel goes down?",
    options: [
      {
        id: "a",
        label: "Lap the sheets 200 mm, tape the laps and pipe penetrations, and patch the tears",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Membrane lapped, taped and sealed around every pipe before the mesh went on.",
      },
      {
        id: "b",
        label: "Run tape over every butt joint and tear so the whole sheet is sealed, and leave the pipes",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome: "The certifier wanted proper 200 mm laps. Mesh was lifted in sections to re-lay the plastic.",
      },
      {
        id: "c",
        label: "Leave it. The concrete will hold it all down, and the slab is what keeps the damp out anyway",
        quality: "poor",
        cost: 3800,
        days: 2,
        inspectionFail: true,
        outcome: "Failed the pre-pour inspection on the membrane. Steel lifted, membrane re-laid, re-inspection fee.",
      },
    ],
    why: "That plastic stops ground moisture wicking up through the slab into the flooring and wall frames. The NCC calls for 0.2 mm polyethylene, lapped at least 200 mm, with the laps and pipe penetrations taped and any punctures patched. It runs under the beams as well. Once the concrete is on top of it, you can't fix it.",
    refs: [
      "ABCB Housing Provisions Section 4: vapour barriers and damp-proofing membranes (0.2 mm polyethylene, 200 mm laps, taped)",
      "AS 2870 Residential slabs and footings: vapour barriers and damp-proofing membranes",
      "NCC 2022 Volume Two Part H2: damp and weatherproofing",
    ],
    units: ["CPCCCO2013", "CPCCCA3028"],
  },
  {
    id: "slab-reo",
    stage: "slab",
    kind: "core",
    order: 20,
    title: "Checking the steel",
    situation:
      "The steel fixer says he's finished. Walking the slab, you see mesh sheets overlapped by about one square, chairs roughly 1.5 m apart with the mesh sagging onto the membrane between them, and trench mesh in the edge beam sitting on the dirt.",
    question: "What needs fixing before the inspection?",
    options: [
      {
        id: "a",
        label:
          "Fix the laps, chairs at about 800 mm centres, and chair the beam steel up for cover",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Laps, chairs and cover all fixed before the inspector arrived. Steel passed first go.",
      },
      {
        id: "b",
        label: "Add more chairs under the sagging mesh and leave the rest. The laps are near enough",
        quality: "partial",
        cost: 700,
        days: 1,
        outcome:
          "The engineer picked up the short laps and the beam steel on the ground. Half a day of rework and a return visit.",
      },
      {
        id: "c",
        label: "Nothing. The concreter always hooks the mesh up into position with a rake as he pours",
        quality: "poor",
        cost: 5200,
        days: 3,
        inspectionFail: true,
        outcome:
          "Failed the pre-pour inspection: no cover to the beam steel and short laps. Steel fixer back for a day, re-inspection, pump re-booked.",
      },
    ],
    why: "Steel only works if it's in the right place and wrapped in concrete. AS 2870 asks for 40 mm of cover to bare ground, 30 mm to a membrane on the ground and 20 mm to an internal surface. Mesh sits on chairs at about 800 mm centres, and sheets overlap by a full lap, with the two outermost cross wires of each sheet overlapping. Hooking mesh up during the pour never puts it back where it belongs.",
    refs: [
      "AS 2870 Residential slabs and footings: reinforcement cover, laps and support",
      "AS 3600 Concrete structures: cover to reinforcement",
      "Engineer's drawings: mesh, laps and bar chairs",
    ],
    units: ["CPCCSF2004", "CPCCCO2013"],
  },
  {
    id: "slab-prepour-inspection",
    stage: "slab",
    kind: "core",
    order: 30,
    title: "Lining up the pour",
    situation: (site) =>
      `It's Monday afternoon. The steel fixer will finish on Wednesday and the concreter wants to pour Friday at 7 am: about ${Math.round(site.houseArea * 0.19)} cubic metres, with the pump booked.`,
    question: "How do you line up the inspections?",
    options: [
      {
        id: "a",
        label:
          "Book the certifier and engineer now for Thursday, and confirm concrete once it's passed",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Steel inspected and passed Thursday. Concrete confirmed, and the pour went ahead Friday at 7.",
      },
      {
        id: "b",
        label: "Wait until the steel is finished Wednesday night, then ring the certifier for a Thursday inspection",
        quality: "partial",
        cost: 450,
        days: 1,
        outcome:
          "The certifier needs 48 hours' notice, so the earliest slot was Friday afternoon. Pour pushed to Monday, and the pump charged a cancellation fee.",
      },
      {
        id: "c",
        label: "Pour Friday regardless, and email the certifier photos of the steel afterwards",
        quality: "poor",
        cost: 7500,
        days: 4,
        inspectionFail: true,
        outcome:
          "Missed critical stage inspection. The certifier required an engineer to scan the slab for steel before they would carry on with the job.",
      },
    ],
    why: "Before any in-situ reinforced concrete is poured, the principal certifier has to inspect it. That's a critical stage inspection in NSW and they need at least 48 hours' notice. Most engineers inspect their steel as well. Book both as soon as you know when the steel will be finished, and never confirm concrete until it has been passed. Photos don't replace the inspection.",
    refs: [
      "EP&A (Development Certification and Fire Safety) Regulation 2021 (NSW): critical stage inspections",
      "Engineer's drawings: inspection requirements",
    ],
    units: ["CPCCOM1014", "CPCCCA3025"],
  },
  {
    id: "slab-water",
    stage: "slab",
    kind: "core",
    order: 40,
    title: "Water in the mix",
    situation:
      "Pour day. The first truck arrives and the docket reads N25, 20 mm aggregate, 100 mm slump, batched 35 minutes ago. That matches the engineer's spec. The concreter looks at it coming down the chute and says, 'Bit stiff. Tell the driver to chuck 40 litres of water in.'",
    question: "What's your call?",
    options: [
      {
        id: "a",
        label:
          "No extra water. Slump test it if in doubt, and order a plasticiser for workability",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Slump tested at 100 mm, right on spec. The rest of the load was ordered with a plasticiser and placed easily.",
      },
      {
        id: "b",
        label: "Let him add a bit of water to the first truck only, then ask the plant to send the rest wetter",
        quality: "partial",
        cost: 500,
        days: 0,
        outcome:
          "The first-truck area finished soft and dusty, and needed a surface hardener before the floor coverings could go down.",
      },
      {
        id: "c",
        label: "Add the water. It's only 40 litres in a full truck, and a wet mix is easier to place and finish",
        quality: "poor",
        cost: 6800,
        days: 2,
        outcome:
          "Test cylinders came back under strength and the surface crazed and dusted. Engineer's assessment, core tests, then grinding and sealing.",
      },
    ],
    why: "Every extra litre of water weakens the concrete, adds shrinkage cracking and leaves a dusty surface. The engineer specified a strength grade and a slump, and the docket has to match. Water can only be added under the supplier's control to bring a load up to the specified slump, never past it. If the crew wants more workability, that's a plasticiser from the plant, not the hose.",
    refs: [
      "AS 1379 Specification and supply of concrete: slump and adding water",
      "AS 2870 and AS 3600: concrete strength grade",
      "Engineer's drawings: concrete specification",
    ],
    units: ["CPCCCO2013"],
  },
  {
    id: "slab-curing",
    stage: "slab",
    kind: "core",
    order: 60,
    title: "The day after the pour",
    situation:
      "The slab is poured, finished and looks great. It's a dry, breezy afternoon. The frame carpenter rings: 'Timber's coming tomorrow. I'll get the truck to drop the packs on the slab and we'll start standing walls in the morning.'",
    question: "What do you tell him, and what do you do with the slab tonight?",
    options: [
      {
        id: "a",
        label:
          "Start curing now and keep it up for a week. No packs on the slab, and frames start in about a week",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Slab cured under plastic for seven days. Timber stacked on gluts beside the slab, frames started on program.",
      },
      {
        id: "b",
        label: "Hose the slab tonight, and let the frames start in a couple of days with the timber packs kept on the ground",
        quality: "partial",
        cost: 600,
        days: 0,
        outcome:
          "One hose-down isn't curing. Shrinkage cracks opened across the garage and the tiler needed a crack-isolation membrane later.",
      },
      {
        id: "c",
        label: "No worries. It's hard enough to walk on, so drop the packs on the slab and start tomorrow",
        quality: "poor",
        cost: 4500,
        days: 2,
        outcome:
          "Two-tonne timber packs on day-old concrete cracked the slab, and fixing plates into green concrete broke out the edge rebate. Engineer's report and repairs.",
      },
    ],
    why: "Concrete gains strength by staying moist. Let it dry out early and the surface ends up weak and cracked. Start curing as soon as finishing is done and keep it going for about seven days, with curing compound, plastic sheet or water. Day-old concrete has a fraction of its design strength, so keep point loads like timber packs off it and give it about a week before standing frames.",
    refs: [
      "AS 3600 Concrete structures: curing",
      "AS 2870 Residential slabs and footings: construction requirements",
      "Cement Concrete & Aggregates Australia: curing guidance",
    ],
    units: ["CPCCCO2013", "CPCCCA2011"],
  },
  {
    id: "slab-hot-weather",
    stage: "slab",
    kind: "site",
    order: 35,
    title: "Hot day for a pour",
    when: (site) => site.startSeason === "summer" || site.startMonth === "November",
    situation:
      "The forecast for pour day is 36 °C with a hot north-westerly. The concrete is booked for 11 am, because that's when the pump was free.",
    question: "What do you change?",
    options: [
      {
        id: "a",
        label:
          "Move the pour to first light, with evaporation retarder, extra hands and curing straight away",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Poured at 5:30 am and finished before the heat. Curing compound on by mid-morning.",
      },
      {
        id: "b",
        label: "Keep 11 am, but wet down the forms and sub-base first and have a hose on the slab as they finish",
        quality: "partial",
        cost: 1800,
        days: 0,
        outcome:
          "The surface dried faster than the crew could finish it. Plastic shrinkage cracks across two rooms, routed and sealed.",
      },
      {
        id: "c",
        label: "Keep the booking and ask the plant for a wetter mix so it stays workable",
        quality: "poor",
        cost: 5800,
        days: 2,
        outcome:
          "A wet mix plus heat and wind: cracking everywhere and a weak, dusty surface. Engineer's report and a topping in the living area.",
      },
    ],
    why: "Hot, dry, windy weather pulls water out of the surface faster than bleed water can replace it, and that's what causes plastic shrinkage cracks. Pour in the cool of the morning, use an evaporation retarder while finishing, have enough crew, and start curing straight away. AS 1379 also limits the concrete's temperature at delivery to 35 °C. Extra water makes all of it worse.",
    refs: [
      "AS 1379 Specification and supply of concrete: temperature at delivery (5 °C to 35 °C)",
      "AS 3600 Concrete structures: curing and protection",
      "Cement Concrete & Aggregates Australia: hot-weather concreting",
    ],
    units: ["CPCCCO2013", "CPCWHS3001"],
  },
  {
    id: "event-rain-pour",
    stage: "slab",
    kind: "event",
    order: 38,
    weight: 3,
    title: "Rain on pour day",
    situation:
      "5:30 am on pour day. It rained overnight and there's water pooled on the membrane and in the beams. The radar shows more heavy showers from mid-morning. The first truck is due at 7.",
    question: "What's your call?",
    options: [
      {
        id: "a",
        label:
          "Postpone before the trucks are batched, pump the water out, and re-book for a clear day",
        quality: "good",
        cost: 450,
        days: 1,
        outcome: "A pump cancellation fee and a day lost, but the slab went down dry two days later.",
      },
      {
        id: "b",
        label: "Go ahead. Pump the water out now and have plastic ready to cover the slab if the showers arrive",
        quality: "partial",
        cost: 1800,
        days: 1,
        outcome:
          "Showers hit halfway through finishing. The plastic saved most of it, but the garage surface washed out and needed a topping.",
      },
      {
        id: "c",
        label: "Pour on. Concrete sets under water anyway, and the pump is already paid for",
        quality: "poor",
        cost: 8500,
        days: 4,
        outcome:
          "Concrete placed into ponded water and rained on before it was finished. Weak surface and a honeycombed edge beam, core tests and a remedial topping.",
      },
    ],
    why: "Water sitting in the forms waters down the mix exactly where the concrete needs to be strongest, and rain on a fresh surface washes the cement paste out. Check the forecast the day before and cancel before the trucks are loaded, because a cancellation fee is cheap. If you get caught mid-pour, cover the surface with plastic, don't trowel rainwater in, and never dry it up with cement.",
    refs: [
      "AS 3600 Concrete structures: placing, finishing and protecting concrete",
      "AS 1379 Specification and supply of concrete",
      "Cement Concrete & Aggregates Australia: wet-weather concreting",
    ],
    units: ["CPCCCO2013", "CPCCOM1014"],
    excludes: ["slab-hot-weather"],
  },
];
