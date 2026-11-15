import type { DecisionDef } from "./types";

export const FRAME: DecisionDef[] = [
  {
    id: "frame-plate-setout",
    stage: "frame",
    kind: "core",
    order: 10,
    title: "Setting out the plates",
    situation:
      "The slab has cured and the frames are due. Before the first plate is fixed down, the carpenter wants to snap chalk lines straight off the slab edge, 'because that's where the walls go'.",
    question: "How should the wall set-out be done?",
    options: [
      {
        id: "a",
        label:
          "Check the slab for square and size first, then set out the plates from the plan dimensions",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Slab checked, plates set out to the plans. Walls straight and the brick cavity even all the way round.",
      },
      {
        id: "b",
        label: "Snap the lines off the slab edge, but check the overall dimensions against the plan as you go",
        quality: "partial",
        cost: 500,
        days: 1,
        outcome: "The slab edge was 12 mm out along the garage. You caught it at the check measure and re-snapped two walls.",
      },
      {
        id: "c",
        label: "Follow the slab edge. The formworker set it out off the surveyor's pegs, so it'll be right",
        quality: "poor",
        cost: 3800,
        days: 3,
        outcome:
          "Frames followed a slab that was out of square. Trusses didn't sit right and the brick cavity ran from 60 mm down to 20 mm along one wall. Walls re-set.",
      },
    ],
    why: "Never trust the slab edge. Check it. Measure the diagonals and overall sizes against the plans, then set your plate lines to the plan so the frame is square and the brick cavity stays even. The NCC wants at least 25 mm of clear cavity for brick veneer, and 40 to 50 mm is typical. Small errors at plate set-out turn into big ones at the roof.",
    refs: [
      "AS 1684.2 Residential timber-framed construction: wall framing",
      "ABCB Housing Provisions Section 5: masonry veneer cavity (25 mm minimum)",
      "Approved plans: dimensions",
    ],
    units: ["CPCCCA3004", "CPCCCA3002", "CPCCOM1015"],
  },
  {
    id: "frame-temp-bracing",
    stage: "frame",
    kind: "core",
    order: 20,
    title: "Wind on an open frame",
    situation:
      "Half the wall frames are stood by lunch. A southerly change is forecast tonight with gusts to 70 km/h. The crew wants to knock off and 'brace it properly when the roof's on'.",
    question: "What needs to happen before you leave site?",
    options: [
      {
        id: "a",
        label:
          "Brace every stood wall in both directions before anyone leaves site",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Every wall braced both ways before knock-off. The frame didn't move in the southerly.",
      },
      {
        id: "b",
        label: "Prop the longest external walls with a couple of timber props each and leave the short ones",
        quality: "partial",
        cost: 900,
        days: 1,
        outcome: "Two unpropped internal walls racked overnight. Nothing broke, but the morning went on re-plumbing.",
      },
      {
        id: "c",
        label: "It's nailed to the slab and to each other at the corners. It'll be right till morning",
        quality: "poor",
        cost: 7200,
        days: 4,
        safety: true,
        outcome:
          "The wind laid 14 metres of wall over onto the slab. Frames wrecked, slab edge chipped, and SafeWork wanted an incident report.",
      },
    ],
    why: "A frame with no roof and no bracing is a sail. AS 1684 requires temporary bracing during construction, equal to at least 60 percent of the permanent bracing, and it stays until the permanent bracing and roof are fixed. Brace as you stand walls, in both directions, every day. The wind doesn't wait for the trusses.",
    refs: [
      "AS 1684.2 Section 8: temporary bracing (at least 60% of the permanent bracing)",
      "WHS Regulation 2017 (NSW): keeping structures stable during construction",
    ],
    units: ["CPCCCA3004", "CPCWHS3001"],
  },
  {
    id: "frame-bracing-cut",
    stage: "frame",
    kind: "core",
    order: 30,
    title: "A hole in the bracing",
    situation:
      "The bracing plan shows structural ply bracing on the garage side wall. The electrician turns up to mount the meter box on that wall and asks if he can cut a 400 x 600 mm hole through the ply so the box sits flush.",
    question: "What do you tell him?",
    options: [
      {
        id: "a",
        label:
          "No cutting. Move the meter box off the panel, or have the bracing redesigned first",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Meter box moved one stud bay along. The bracing panel stayed whole.",
      },
      {
        id: "b",
        label: "Let him cut it, then nail an extra sheet of ply over the stud bay beside it to make up for it",
        quality: "partial",
        cost: 900,
        days: 1,
        outcome:
          "Extra ply isn't a designed brace. The certifier wanted the bracing designer to confirm it, and a new panel was added on the next wall.",
      },
      {
        id: "c",
        label: "Fine. It's only one sheet, and there's plenty of other bracing in the house",
        quality: "poor",
        cost: 3600,
        days: 2,
        inspectionFail: true,
        outcome:
          "Frame inspection failed: a bracing panel with a hole through it has no rated capacity. Panel replaced, meter box moved, re-inspection.",
      },
    ],
    why: "Bracing is what stops the house racking sideways in the wind. Each sheet-braced panel has a rated capacity that depends on the sheet being whole and nailed off to the pattern in AS 1684. Cut a big hole in it and that capacity is gone. Services go around the bracing, or the bracing gets redesigned by whoever designed it.",
    refs: [
      "AS 1684.2 Section 8: racking and shear forces (bracing)",
      "Bracing layout on the approved framing plans",
    ],
    units: ["CPCCCA3004", "CPCCOM1014"],
  },
  {
    id: "frame-lintel",
    stage: "frame",
    kind: "core",
    order: 40,
    title: "A wider opening",
    situation:
      "The client has changed their mind and wants the 1800 mm lounge window widened to a 3000 mm stacker door. The frames are already stood. The carpenter says he'll cut out two studs and 'throw in a bigger bit of pine' for the lintel.",
    question: "How do you handle it?",
    options: [
      {
        id: "a",
        label:
          "Treat it as a variation: get the lintel and jamb studs sized, priced and signed, then build it",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Engineer sized an LVL lintel and extra jamb studs. Variation signed, opening built once.",
      },
      {
        id: "b",
        label: "Go up a size from the existing lintel and double the jamb studs each side to be safe",
        quality: "partial",
        cost: 1200,
        days: 1,
        outcome:
          "A guess isn't a design. The certifier asked for the lintel sizing at frame inspection, and it was changed out for an LVL.",
      },
      {
        id: "c",
        label: "Let the carpenter sort it. He's framed bigger openings than this and knows what he's doing",
        quality: "poor",
        cost: 6000,
        days: 3,
        inspectionFail: true,
        outcome:
          "The undersized lintel sagged under the girder truss. Failed frame inspection, then propping, a new engineered lintel and re-fixed jambs.",
      },
    ],
    why: "A lintel carries the roof load over an opening. Its size depends on the span, what sits above it and the wind class, and a girder truss overhead changes everything. AS 1684 has span tables for it, and outside the tables it's an engineer's job. A wider opening also needs more jamb studs and different tie-down. And any client change is a variation: in writing and signed before the work starts.",
    refs: [
      "AS 1684.2 Section 6: lintels and jamb studs, with the span tables",
      "Home Building Act 1989 (NSW): contract variations in writing",
    ],
    units: ["CPCCCA3004", "CPCCCA3025", "CPCCOM3001"],
  },
  {
    id: "frame-tiedown",
    stage: "frame",
    kind: "core",
    order: 50,
    title: "Holding the roof down",
    situation: (site) =>
      `The site's wind classification is ${site.windClass}. The frame carpenter is finishing the top plates and says, 'I'll just skew-nail the trusses to the plate like the last job. That was only two streets away.'`,
    question: "How do you decide the tie-down?",
    options: [
      {
        id: "a",
        label:
          "Follow the tie-down schedule on the engineering for this wind class, from roof to slab",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Tie-down installed to the schedule from the roof to the slab. Nothing to add at frame inspection.",
      },
      {
        id: "b",
        label: "Put a framing anchor on every truss. That's stronger than skew nails, so it must be enough",
        quality: "partial",
        cost: 800,
        days: 1,
        outcome:
          "Better than nails, but the girder trusses needed strapping and the bracing walls needed hold-down bolts. The certifier listed them at frame inspection.",
      },
      {
        id: "c",
        label: "Skew nails are standard. Do what worked last time, since it's the same estate",
        quality: "poor",
        cost: 4800,
        days: 3,
        inspectionFail: true,
        outcome:
          "Frame inspection failed: the tie-down didn't match the schedule. Fixings were retrofitted with the sarking and battens in the way.",
      },
    ],
    why: "Wind tries to lift the roof off, and it takes an unbroken chain of fixings to hold it down: roof to wall, wall to floor, floor to footing. The size of each link depends on the wind classification under AS 4055, the roof type and the truss spans, and it's set out in AS 1684 and on the engineering. Two streets away can be a different wind class. Nominal nailing is only enough where the tables say so.",
    refs: [
      "AS 1684.2 Section 9: fixings and tie-down design",
      "AS 4055 Wind loads for housing: wind classification",
      "Truss manufacturer's layout and tie-down schedule",
    ],
    units: ["CPCCCA3004", "CPCCCA3006", "CPCCCA3025"],
  },
  {
    id: "frame-wrap",
    stage: "frame",
    kind: "core",
    order: 60,
    title: "The wrong wrap",
    situation: (site) =>
      `The wall wrap has arrived. The label says it's a foil-faced, non-permeable sarking. The site is in NCC climate zone ${site.climateZone}.`,
    question: "Do you install it?",
    options: [
      {
        id: "a",
        label:
          "No. It has to be vapour-permeable in this climate zone. Send it back for the specified wrap",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Wrap swapped at the supplier's cost before a single sheet went on.",
      },
      {
        id: "b",
        label: "Install it, but leave the laps untaped and the bottom edge open so the wall can breathe",
        quality: "partial",
        cost: 1500,
        days: 1,
        outcome:
          "Untaped laps don't make a vapour barrier breathe, and now it leaks air as well. Two walls were stripped and re-wrapped.",
      },
      {
        id: "c",
        label: "Wrap is wrap, and foil is better insulation anyway. Get it on so the brickies can start",
        quality: "poor",
        cost: 5400,
        days: 3,
        outcome:
          "Picked up before lining: wrong membrane for the climate zone, with brickwork already started. Replaced from the inside in strips to the manufacturer's detail.",
      },
    ],
    why: "Warm, damp air from inside the house moves into the wall and meets the cold wrap. If the wrap can't let vapour through, the water condenses inside the wall, and you get mould and rot. NCC 2022 requires vapour-permeable wall membranes in the cooler climate zones, 4 to 8, installed to AS 4200.2. Check the product's vapour class against the spec before it goes on.",
    refs: [
      "NCC 2022 Volume Two Part H4: condensation management",
      "ABCB Housing Provisions Part 10.8: pliable building membranes by climate zone",
      "AS 4200.1 and AS 4200.2 Pliable building membranes",
    ],
    units: ["CPCCCA3017", "CPCCCA2011"],
  },
  {
    id: "event-wrong-timber",
    stage: "frame",
    kind: "event",
    order: 5,
    weight: 3,
    title: "Wrong timber delivery",
    situation:
      "The frame timber has arrived. Checking the docket against the order: the wall studs are untreated MGP10, where the order and the plans say H2F termite-treated, and the lintel pack is 190 x 45 MGP10 where the plans call for a 240 x 45 LVL over the garage opening. The truck driver wants a signature.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "Refuse the wrong items, note it on the docket, and get the supplier to send the right material",
        quality: "good",
        cost: 0,
        days: 1,
        outcome: "Wrong packs went back on the truck. The right timber arrived next morning, with one day lost.",
      },
      {
        id: "b",
        label: "Accept it all. Use the untreated pine for internal walls now and sort the lintel when the LVL turns up",
        quality: "partial",
        cost: 1200,
        days: 2,
        outcome:
          "Untreated studs went into walls the termite plan said were H2F. The certifier wanted them replaced.",
      },
      {
        id: "c",
        label: "Sign for it and use it. Pine is pine, and a 190 will do the job",
        quality: "poor",
        cost: 7500,
        days: 4,
        inspectionFail: true,
        outcome:
          "Frame inspection: undersized garage lintel and untreated framing against the spec. Lintel propped and replaced, walls re-framed in H2F.",
      },
    ],
    why: "What's on the truck has to match what's on the plans. Stress grade, size and treatment level are all part of the design. A 190 MGP10 isn't a 240 LVL, and untreated pine isn't part of a termite management system that relies on H2F framing. Check every delivery against the order before you sign, write problems on the docket, and never swap a structural member without the span tables or the engineer.",
    refs: [
      "AS 1684.2: timber stress grades, sizes and span tables",
      "AS 1604 Preservative-treated wood: hazard classes (H2F)",
      "AS 3660.1 Termite management: termite-resistant framing",
      "Approved plans and framing schedule",
    ],
    units: ["CPCCCA2011", "CPCCCA3004"],
  },
  {
    id: "event-client-visit",
    stage: "frame",
    kind: "event",
    order: 45,
    weight: 1,
    title: "Unannounced visitors",
    situation:
      "The client turns up unannounced with two kids in thongs to 'have a look around', while the frame carpenters are working overhead and there are offcuts and nail guns all over the slab.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label:
          "No entry right now. Book an escorted walk-through at a safe time, in closed shoes and PPE",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Walk-through booked for Friday afternoon. The client appreciated being shown around properly.",
      },
      {
        id: "b",
        label: "Let them in for five minutes, but tell them to stay near the front and keep an eye on the kids",
        quality: "partial",
        cost: 200,
        days: 0,
        safety: true,
        outcome:
          "The youngest picked a nail gun up off the slab. No injury, but the carpenters stopped work and you got lucky.",
      },
      {
        id: "c",
        label: "It's their house and they're paying for it. Let them have a wander",
        quality: "poor",
        cost: 4000,
        days: 2,
        safety: true,
        outcome:
          "A child stepped on a nail and an offcut dropped from above just missed the client. Incident report, insurer notified, work stopped.",
      },
    ],
    why: "Until handover the site is a workplace and you control it. Under WHS law you owe a duty to visitors as well as workers, and under the building contract the owner comes on site by arrangement. Welcome their interest: set regular escorted visits at a safe time, with proper footwear and PPE. Kids and live construction don't mix.",
    refs: [
      "WHS Act 2011 (NSW): duty to other persons at the workplace",
      "WHS Regulation 2017 (NSW): security of the workplace",
      "Home building contract: owner's access to the site",
    ],
    units: ["CPCCWHS2001", "CPCCOM1014"],
  },
];
