import "server-only";

import { days, money, shortDate, VERDICT_LABEL } from "@/lib/format";
import { DECISION_BY_ID } from "@/lib/game/scenarios";
import { describeSite } from "@/lib/game/site";
import type { GameState, Scorecard } from "@/lib/game/types";
import { QUALIFICATION } from "@/lib/game/units";
import type { PhotoRow } from "./store";

// Builds the downloadable evidence file: one self-contained HTML page (no
// external files) that opens on any device and prints cleanly to PDF.

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((part) => `<p>${esc(part.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:#F5F3EE;color:#1D2733;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:820px;margin:0 auto;padding:28px 20px 60px}
  h1{font-size:30px;line-height:1.1;margin:0 0 4px;letter-spacing:-.01em}
  h2{font-size:19px;margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid #1D2733}
  h3{font-size:15px;margin:22px 0 6px;text-transform:uppercase;letter-spacing:.06em;color:#D9661F}
  p{margin:0 0 8px}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#D9661F;font-weight:700}
  .muted{color:#5a6470}
  .note{background:#fff;border-left:4px solid #D9661F;padding:10px 14px;margin:16px 0;font-size:14px}
  table{width:100%;border-collapse:collapse;margin:8px 0;background:#fff}
  th,td{text-align:left;vertical-align:top;padding:8px 10px;border:1px solid #d9d6cf;font-size:14px}
  th{background:#1D2733;color:#fff;font-weight:600}
  .scores{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0}
  .score{background:#fff;border:1px solid #d9d6cf;padding:12px}
  .score b{display:block;font-size:30px;line-height:1}
  .score span{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5a6470}
  .overall{background:#1D2733;color:#fff;padding:14px 16px;margin:10px 0;display:flex;justify-content:space-between;align-items:center;gap:16px}
  .overall b{font-size:38px;line-height:1}
  .item{background:#fff;border:1px solid #d9d6cf;padding:12px 14px;margin:10px 0;break-inside:avoid}
  .item h4{margin:0 0 6px;font-size:16px}
  .tag{display:inline-block;padding:1px 8px;border-radius:99px;font-size:12px;font-weight:700;color:#fff;margin-right:6px}
  .good{background:#2E7D5B}.partial{background:#A86A0B}.poor{background:#B23A2B}
  .label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5a6470;margin-top:8px}
  img{max-width:100%;height:auto;border:1px solid #d9d6cf}
  .sign{display:grid;grid-template-columns:2fr 2fr 1fr;gap:18px;margin-top:14px}
  .sign div{border-bottom:1px solid #1D2733;height:44px;font-size:12px;color:#5a6470}
  @media (max-width:560px){.scores{grid-template-columns:repeat(2,1fr)}.sign{grid-template-columns:1fr}}
  @media print{body{background:#fff}main{padding:0;max-width:none}.item,.score,table{break-inside:avoid}}
`;

export function renderEvidence(input: {
  student: string;
  email: string;
  title: string;
  state: GameState;
  card: Scorecard;
  photos: PhotoRow[];
}): string {
  const { state, card } = input;
  const site = state.site;

  const scores = [
    { label: "Cost", score: card.cost.score },
    { label: "Time", score: card.time.score },
    { label: "Compliance", score: card.compliance.score },
    { label: "Decision quality", score: card.decisions.score },
  ]
    .map((item) => `<div class="score"><b>${item.score}</b><span>${esc(item.label)}</span></div>`)
    .join("");

  const units = card.units
    .map(
      (unit) => `<tr>
        <td><b>${esc(unit.code)}</b>${unit.elective ? '<br><span class="muted">elective</span>' : ""}</td>
        <td>${esc(unit.title)}</td>
        <td>${unit.points} of ${unit.decisions}</td>
        <td>${unit.items
          .map((item) => `<span class="tag ${item.quality}">${esc(VERDICT_LABEL[item.quality])}</span>${esc(item.title)} <span class="muted">(${esc(item.stage)})</span>`)
          .join("<br>")}</td>
      </tr>`,
    )
    .join("");

  const stages = card.stages
    .filter((stage) => stage.items.length > 0)
    .map((stage) => {
      const items = stage.items
        .map((entry) => {
          const decision = DECISION_BY_ID.get(entry.decisionId);
          const situation = decision
            ? typeof decision.situation === "function"
              ? decision.situation(site)
              : decision.situation
            : "";
          const consequences = [
            entry.cost > 0 ? `${money(entry.cost)} extra cost` : "no extra cost",
            entry.days > 0 ? `${days(entry.days)} lost` : "no time lost",
            entry.inspectionFail ? "failed or missed inspection" : "",
            entry.safety ? "safety breach" : "",
          ]
            .filter(Boolean)
            .join(", ");
          return `<div class="item">
            <h4><span class="tag ${entry.quality}">${esc(VERDICT_LABEL[entry.quality])}</span>${esc(entry.title)}${entry.kind === "event" ? ' <span class="muted">(site event)</span>' : ""}</h4>
            ${situation ? `<p>${esc(situation)}</p>` : ""}
            ${decision ? `<p><b>${esc(decision.question)}</b></p>` : ""}
            <div class="label">Student's answer (${entry.mode === "tap" ? "selected option" : entry.mode === "voice" ? "spoken, in own words" : "typed, in own words"})</div>
            <p>${esc(entry.answer)}</p>
            <div class="label">Result</div>
            <p>${esc(consequences)}. ${esc(entry.outcome)}</p>
            <div class="label">Foreman's feedback${entry.aiFeedback ? " (AI generated)" : ""}</div>
            ${paragraphs(entry.feedback)}
            ${decision ? `<div class="label">References</div><p class="muted">${decision.refs.map(esc).join("<br>")}</p>` : ""}
            <div class="label">Units</div><p class="muted">${entry.units.map(esc).join(", ")}</p>
          </div>`;
        })
        .join("");
      return `<h3>${esc(stage.name)}</h3>${items}`;
    })
    .join("");

  const photos =
    input.photos.length === 0
      ? ""
      : `<h2>Workshop photo checks</h2>` +
        input.photos
          .map(
            (photo) => `<div class="item">
              <h4>${esc(photo.task)} <span class="muted">(${esc(shortDate(photo.createdAt))})</span></h4>
              <p><img alt="Student's workshop photo" src="data:image/jpeg;base64,${photo.image || photo.thumb}"></p>
              ${photo.note ? `<div class="label">Student's note</div><p>${esc(photo.note)}</p>` : ""}
              <div class="label">Foreman's first look and question (AI generated)</div>${paragraphs(photo.observations)}
              <div class="label">Student's explanation</div>${paragraphs(photo.reasoning)}
              <div class="label">Foreman's feedback (AI generated)</div>${paragraphs(photo.feedback)}
            </div>`,
          )
          .join("");

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Foreman: build debrief for ${esc(input.student)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
  <div class="kicker">The Foreman · Build debrief</div>
  <h1>${esc(input.title)}</h1>
  <p class="muted">${esc(input.student)} (${esc(input.email)}) · ${esc(shortDate(state.startedAt))} to ${esc(shortDate(state.completedAt))} · ${state.length === "quick" ? "Quick build" : "Full build"}, ${card.decisions.total} decisions</p>

  <div class="note">This is supporting evidence from a simulated build. It records the decisions the student made as site foreman and maps them to units of competency in ${esc(QUALIFICATION.code)} ${esc(QUALIFICATION.title)}. It shows underpinning knowledge only. It is not a competency decision, which rests with the assessor.</div>

  <h2>The site</h2>
  <p>${esc(describeSite(site))}</p>
  <p>Budget ${money(card.cost.budget)} (including ${money(card.cost.contingency)} contingency). Program ${card.time.programDays} working days (including ${card.time.floatDays} days of float).</p>

  <h2>Results</h2>
  <div class="overall"><div><div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;opacity:.75">Overall</div><div style="font-size:20px;font-weight:700">${esc(card.rating.label)}</div><div style="opacity:.85">${esc(card.rating.note)}</div></div><b>${card.overall}</b></div>
  <div class="scores">${scores}</div>
  <table>
    <tr><th>Measure</th><th>Result</th></tr>
    <tr><td>Cost</td><td>Finished at ${money(card.cost.finalCost)} against a budget of ${money(card.cost.budget)}: ${card.cost.over > 0 ? `${money(card.cost.over)} over` : `${money(-card.cost.over)} under`}.</td></tr>
    <tr><td>Time</td><td>Finished in ${card.time.finalDays} working days against a program of ${card.time.programDays}: ${card.time.over > 0 ? `${days(card.time.over)} late` : `${days(-card.time.over)} early`}.</td></tr>
    <tr><td>Compliance</td><td>${card.compliance.failedInspections} failed or missed inspections, ${card.compliance.safetyBreaches} safety breaches.</td></tr>
    <tr><td>Decision quality</td><td>${card.decisions.good} right, ${card.decisions.partial} partly right, ${card.decisions.poor} wrong, out of ${card.decisions.total}. ${card.decisions.ownWords} answered in the student's own words.</td></tr>
  </table>
  <p class="muted">Scores are out of 100. Overall is 40% decision quality, 30% compliance, 15% cost and 15% time.</p>

  ${state.debrief ? `<h2>Foreman's debrief</h2>${paragraphs(state.debrief.text)}${state.debrief.ai ? '<p class="muted">Written by the AI foreman from the results above.</p>' : ""}` : ""}

  <h2>Units of competency: ${esc(QUALIFICATION.code)} ${esc(QUALIFICATION.title)}</h2>
  <table>
    <tr><th>Unit</th><th>Title</th><th>Sound decisions</th><th>Evidence</th></tr>
    ${units}
  </table>
  <p class="muted">Sound decisions count a right call as 1 and a partly right call as 0.5.</p>

  <h2>Decision record</h2>
  ${stages}

  ${photos}

  <h2>Assessor use</h2>
  <p class="muted">Comments:</p>
  <div style="border:1px solid #d9d6cf;background:#fff;height:110px"></div>
  <div class="sign"><div>Assessor name</div><div>Signature</div><div>Date</div></div>
</main>
</body>
</html>`;
}
