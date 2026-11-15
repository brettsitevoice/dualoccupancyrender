import type { DecisionDef } from "./types";

export const HANDOVER: DecisionDef[] = [
  {
    id: "handover-ground-levels",
    stage: "handover",
    kind: "core",
    order: 10,
    title: "Garden beds against the wall",
    situation:
      "The landscaper has finished. Garden beds are built up against the back wall to the top of the first brick course, covering the weep holes and the slab edge, and the new path along the side slopes gently back towards the house.",
    question: "What needs to change before handover?",
    options: [
      {
        id: "a",
        label:
          "Lower the beds to expose the weep holes and slab edge, and re-lay the path to fall away",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Beds cut back and the path re-laid by the landscaper before the final inspection.",
      },
      {
        id: "b",
        label: "Scrape the soil back from the weep holes so they can drain, and leave the rest as it is",
        quality: "partial",
        cost: 600,
        days: 1,
        outcome:
          "The weep holes are clear, but the path still drains to the wall and the slab edge is buried. The path was re-laid.",
      },
      {
        id: "c",
        label: "Leave it. Landscaping isn't part of the building work, and it's the owner's garden after handover",
        quality: "poor",
        cost: 4800,
        days: 2,
        inspectionFail: true,
        outcome:
          "Final inspection failed on site drainage and the buried termite inspection zone. Path ripped up and re-laid, beds dug out.",
      },
    ],
    why: "Three things protect the bottom of a brick veneer wall. Weep holes let the cavity drain. An exposed strip of slab edge, 75 mm at least, means termites can't get in unseen. And the ground falls away from the house: the NCC wants the slab at least 150 mm above finished ground, with 50 mm of fall over the first metre. Bury any of them and you get damp walls, hidden termites and a moving slab.",
    refs: [
      "ABCB Housing Provisions Part 3.3: surface water drainage (150 mm slab height, 50 mm fall in the first metre)",
      "AS 3660.1 Termite management: slab edge inspection zone (75 mm)",
      "ABCB Housing Provisions Section 5: weepholes",
    ],
    units: ["CPCCCA3025", "CPCCOM1014"],
  },
  {
    id: "handover-certificates",
    stage: "handover",
    kind: "core",
    order: 20,
    title: "The paperwork",
    situation:
      "The certifier's office emails: 'Final inspection is booked. Please have all compliance documentation ready.' Your file has the engineer's slab certificate and the frame inspection result. That's it.",
    question: "What else do you need to pull together?",
    options: [
      {
        id: "a",
        label:
          "Certificates from every licensed trade and supplier, plus the BASIX evidence",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Full certificate pack handed over at the final. Occupation certificate issued within the week.",
      },
      {
        id: "b",
        label: "The electrical and plumbing certificates. Those are the two the law requires for a house",
        quality: "partial",
        cost: 300,
        days: 2,
        outcome:
          "The occupation certificate was held up while you chased waterproofing, glazing and termite certificates from trades who had moved on.",
      },
      {
        id: "c",
        label: "Nothing more. The certifier did every stage inspection and can see the house is finished",
        quality: "poor",
        cost: 1800,
        days: 5,
        outcome:
          "No paperwork, no occupation certificate. Weeks of chasing trades, and the waterproofer had closed his business, so a new inspection report had to be paid for.",
      },
    ],
    why: "The certifier can't see inside walls or under tiles, so the occupation certificate is built on evidence: certificates from the licensed people who did the work, plus proof that the BASIX commitments were met. Collect each certificate when the trade finishes, not at the end. It's far easier to get before they've been paid in full.",
    refs: [
      "EP&A Act 1979 (NSW): occupation certificates",
      "BASIX: completion of commitments",
      "AS/NZS 3000, AS/NZS 3500, AS 3740, AS 1288 and AS 3660.1: trade certification",
    ],
    units: ["CPCCOM1014", "CPCCCA3025"],
  },
  {
    id: "handover-defects",
    stage: "handover",
    kind: "core",
    order: 30,
    title: "The walk-through",
    situation:
      "Pre-handover walk-through with the client. They point at a 3 mm bow in a hallway wall measured over a 2 m straight edge, paint runs on the laundry door frame, and a hairline crack in the garage slab. They want the wall rebuilt, the house repainted and the slab replaced.",
    question: "How do you handle it?",
    options: [
      {
        id: "a",
        label:
          "List every item, check each against the Standards and Tolerances guide, and fix real defects",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Paint runs fixed that week. The client accepted the written explanation for the wall and the slab.",
      },
      {
        id: "b",
        label: "Agree to fix all of it. A happy client at handover is worth more than the cost of the repairs",
        quality: "partial",
        cost: 4500,
        days: 3,
        outcome: "You rebuilt a wall that was within tolerance, and set the bar for every other item on their list.",
      },
      {
        id: "c",
        label: "Tell them it's all within normal building tolerances and they need to sign off today",
        quality: "poor",
        cost: 2500,
        days: 3,
        outcome:
          "The client refused handover and complained to the regulator. An inspector's visit, a rectification order for the paint, and final payment delayed.",
      },
    ],
    why: "Not every imperfection is a defect, and not every complaint is unreasonable. The NSW Guide to Standards and Tolerances gives the benchmarks: for example, a wall within 4 mm over a 2 m straight edge is acceptable, and hairline shrinkage cracks in a slab are normal. Walk the house with the client, write everything down, fix real defects quickly, and explain the rest calmly with the reference in hand.",
    refs: [
      "NSW Guide to Standards and Tolerances",
      "Home Building Act 1989 (NSW): statutory warranties",
      "AS 2870 Residential slabs and footings: classification of cracking",
    ],
    units: ["CPCCOM1014", "CPCCOM1012"],
  },
  {
    id: "handover-occupation",
    stage: "handover",
    kind: "core",
    order: 40,
    title: "Moving in early",
    situation:
      "The house looks finished. The client's lease ends on Friday and they ask if they can start moving furniture in on Thursday, 'just into the garage and bedrooms'. The final inspection is booked for the following Tuesday.",
    question: "What's your answer?",
    options: [
      {
        id: "a",
        label:
          "No moving in before the occupation certificate. Offer to bring the final inspection forward",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "Final inspection brought forward to Monday. Occupation certificate issued and keys handed over on Wednesday.",
      },
      {
        id: "b",
        label: "Furniture in the garage only, and nobody sleeps in the house until the certificate comes through",
        quality: "partial",
        cost: 400,
        days: 1,
        outcome:
          "Storing their things is still using the building, and it muddied whose risk the house was. The certifier let it go with a warning.",
      },
      {
        id: "c",
        label: "Sure. It's their house, it's finished, and the inspection is only a formality",
        quality: "poor",
        cost: 3500,
        days: 2,
        outcome:
          "The certifier arrived to a lived-in house with no occupation certificate. A notice to the owner and builder, and a dispute over final payment.",
      },
    ],
    why: "A new house can't be occupied or used until the principal certifier issues an occupation certificate. That's the EP&A Act. Until handover, the site is also still the builder's risk and responsibility. The quickest way to help the client is to have the final inspection booked and every certificate ready, so the certificate comes through without delay.",
    refs: [
      "EP&A Act 1979 (NSW): occupation certificates",
      "Home building contract: practical completion and handover",
    ],
    units: ["CPCCOM1014", "CPCCOM1012"],
  },
  {
    id: "handover-pack",
    stage: "handover",
    kind: "core",
    order: 50,
    title: "Handing over the keys",
    situation: "The occupation certificate has been issued. It's handover day, and the client arrives for the keys.",
    question: "What do you hand over along with the keys?",
    options: [
      {
        id: "a",
        label:
          "A handover pack: certificates, warranties, manuals and written maintenance advice",
        quality: "good",
        cost: 0,
        days: 0,
        outcome: "The owner left with a full pack and knew exactly who to call. A quiet warranty period.",
      },
      {
        id: "b",
        label: "The keys, the appliance manuals and your phone number, so they can ring if anything comes up",
        quality: "partial",
        cost: 400,
        days: 0,
        outcome: "The owner rang a dozen times in the first month about things a maintenance guide would have answered.",
      },
      {
        id: "c",
        label: "Just the keys. The paperwork is all with the certifier and they can ask for copies",
        quality: "poor",
        cost: 1500,
        days: 1,
        outcome:
          "Months later the owner built garden beds over the slab edge and watered them daily. The claim landed on you, with nothing to show you ever gave maintenance advice.",
      },
    ],
    why: "Handover is the start of the warranty period, not the end of the job. In NSW the statutory warranties run for 6 years for major defects and 2 years for everything else. Give the owner the certificates, warranties and manuals, plus written maintenance advice: termite inspections, keeping drainage working, and looking after foundations on reactive soil. It protects the house, and it protects you.",
    refs: [
      "Home Building Act 1989 (NSW): statutory warranties (6 years for major defects, 2 years for other defects)",
      "CSIRO BTF 18 Foundation Maintenance and Footing Performance: A Homeowner's Guide",
      "AS 3660.2 Termite management: inspections of existing buildings",
    ],
    units: ["CPCCOM1014", "CPCCOM1012"],
  },
  {
    id: "event-basix",
    stage: "handover",
    kind: "event",
    order: 15,
    weight: 1,
    title: "The BASIX check",
    situation:
      "Checking the BASIX certificate before the final: it commits to a 3,000 L rainwater tank connected to the toilets, the washing machine tap and a garden tap. The plumber has connected the tank to the garden tap only. 'Nobody checks that,' he says.",
    question: "What do you do?",
    options: [
      {
        id: "a",
        label: "Get it connected as the BASIX certificate says before the final inspection",
        quality: "good",
        cost: 0,
        days: 1,
        outcome: "The plumber ran the lines at his own cost. One day lost, and the final went through clean.",
      },
      {
        id: "b",
        label: "Ask the certifier whether they'll accept it as built, since the tank itself is installed",
        quality: "partial",
        cost: 500,
        days: 2,
        outcome:
          "They won't. The commitments stand unless a revised BASIX certificate is approved. The plumber came back to run the lines.",
      },
      {
        id: "c",
        label: "Leave it. The tank is there and working, and it's unlikely to be picked up",
        quality: "poor",
        cost: 3800,
        days: 4,
        inspectionFail: true,
        outcome:
          "The certifier checks BASIX line by line. Final failed, and pipework was chased into finished walls and ceilings, with patching and repainting.",
      },
    ],
    why: "BASIX is the NSW energy and water scheme, and every commitment on the certificate is a condition of your approval: the tank size and what it connects to, the hot water system, insulation, glazing and shading. The certifier checks them at the final and can't issue an occupation certificate until they're met. Read the BASIX certificate at the start of the job and give each trade their list.",
    refs: [
      "BASIX: State Environmental Planning Policy (Sustainable Buildings) 2022 (NSW)",
      "EP&A Regulation 2021 (NSW): BASIX commitments as conditions of consent",
      "NCC 2022 Volume Two Part H6: energy efficiency (applied in NSW through BASIX)",
    ],
    units: ["CPCCCA3025", "CPCCOM1012"],
  },
];
