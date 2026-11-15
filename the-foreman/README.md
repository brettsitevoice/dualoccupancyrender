# The Foreman

A phone-first site simulator that teaches TAFE NSW construction students how to run a residential build.

The student runs a virtual single-storey brick veneer house build in New South Wales, from set-out to handover. An AI foreman (Claude, through the Anthropic API) briefs them at each stage, puts a situation to them and asks what they would do. They answer by voice or by tapping an option. The foreman checks the answer against the National Construction Code, the relevant Australian Standards, NSW requirements and correct build sequence, then explains why it was right or wrong in plain site language.

## What's in it

- **Eight stages**: set-out, footings, slab, frame, roof, lock-up, fit-off, handover.
- **A generated site for every job**: suburb, block size and fall, soil class, wind classification, bushfire attack level, climate zone, distance to the coast, house size, roof type, a budget in Australian dollars and a program in working days. The site's conditions change which decisions come up.
- **Game mechanics**: good calls keep the job on time and on budget. Poor calls cost money, add days, fail an inspection or breach safety. Random site events (rain on pour day, the wrong timber delivery, a subcontractor no-show, a defect found by the certifier, and others) need a response.
- **Voice or tap**: answer in your own words using the browser's speech recognition (or by typing), or tap one of the options.
- **Workshop photo check**: upload a photo of practical work. The foreman says what he sees, asks the student to explain their reasoning, then gives feedback.
- **Debrief and scorecard**: cost, time, compliance and decision quality, mapped to units of competency from CPC30220 Certificate III in Carpentry. Save as PDF or download as a single file to hand in as supporting evidence.
- **Student login** with progress saved to a database, so a build can be picked up later.

All measurements are metric.

## Run it

You need Node.js 20.19 or newer.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Put your Anthropic API key in `.env.local`, then:

```bash
npm run dev
```

Open http://localhost:3000. To try it on a phone, open the computer's network address shown in the terminal while both are on the same Wi-Fi.

Without an API key the app still runs: answers are tapped, and explanations come from the built-in course notes. Voice answers, follow-up questions and photo checks need the key.

## Settings

Set these in `.env.local` (see `.env.example`).

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Used on the server only and never sent to the browser. |
| `FOREMAN_MODEL` | Model for the foreman. Default `claude-fable-5-2`. |
| `FOREMAN_EFFORT` | How hard the model thinks on normal turns: `low` (default), `medium` or `high`. Lower is faster. |
| `FOREMAN_PHOTO_EFFORT` | The same, for photo checks. Default `medium`. |
| `DATABASE_URL` | Where progress is saved. Default `file:./data/foreman.db` (a local SQLite file). |
| `DATABASE_AUTH_TOKEN` | Token for a hosted database, if `DATABASE_URL` points at one. |
| `SIGNUP_CODE` | Optional class code. If set, students must enter it to create an account. |

## How it works

**The game engine decides the consequences, not the AI.** Every decision and site event is written in advance in `src/lib/game/scenarios/`, with its options, what each one costs, the reasoning and the references behind it. The engine in `src/lib/game/engine.ts` chooses which ones a job gets, applies the cost and time, and works out the scores. All of that runs on the server, and the browser is never told which option is right until the student has answered.

**The AI foreman does the talking and the judging of free answers.** He:

- briefs the student at the start of each stage, using how the job is tracking
- explains each call in his own words, grounded in the course notes for that decision
- judges an answer given in the student's own words as right, partly right or wrong (the dollars and days still come from the authored options)
- answers follow-up questions after a call
- reviews workshop photos in two steps: first look and a question, then feedback once the student has explained
- gives a debrief at the end

The code that calls the Anthropic API is in `src/lib/ai/`. The system prompt and a one-page reference sheet are in `src/lib/ai/prompts.ts`.

If the API can't be reached, or the model declines a request, the game carries on with the built-in notes. Server-side refusal fallback is switched on, so a request the main model declines is retried on Anthropic's recommended fallback model.

### Scoring

| Score | How it's worked out |
| --- | --- |
| Cost | 100 if the job finishes within budget. Loses 20 points for every 1% over. |
| Time | 100 if the job finishes within program. Loses 5 points for each day over. |
| Compliance | Starts at 100. Minus 10 for each failed inspection or safety breach, minus 3 for each other wrong call, minus 1 for each partly right call. |
| Decision quality | A right call counts 1 and a partly right call 0.5, as a percentage of decisions made. |
| Overall | 40% decision quality, 30% compliance, 15% cost, 15% time. |

A quick build is 18 decisions (two per stage plus two site events). A full build is 28 (three per stage plus four site events).

## Project layout

```
src/app/                  screens and API routes
src/components/           screen components
src/hooks/useSpeech.ts    voice input (browser speech recognition)
src/lib/game/             the game: site generator, stages, scenarios, engine, scorecard, unit mapping
src/lib/ai/               the foreman: prompts and Anthropic API calls
src/lib/server/           database, login, rate limiting, evidence export
tests/                    engine, scenario bank and streaming tests
```

## The database

It starts with SQLite, with no setup: a file at `data/foreman.db`.

A local file only suits hosting that keeps a disk between restarts (a server or a container with a volume). On serverless hosting such as Vercel, point `DATABASE_URL` at a hosted libSQL database (for example Turso) and set `DATABASE_AUTH_TOKEN`. The app needs no other change.

Every query is in `src/lib/server/store.ts`, so moving to another database later means rewriting that one file.

## Checks

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run typecheck
```

The tests cover the game engine, a full play-through, the scoring, the rule that answers never reach the browser early, and the scenario bank itself (for example, that the right answer is not given away by being the longest option).

## Before using it with students

- **Have a teacher review the scenario content.** The decisions, costs and references in `src/lib/game/scenarios/` were written for this project from NCC 2022, the Australian Standards and NSW requirements, and have not been reviewed by a qualified trainer or checked against the current editions of the standards. Costs and delays are indicative, for the game only.
- **The scorecard is supporting evidence.** It shows the decisions a student made and maps them to units of competency. It records knowledge, not practical performance, and the competency decision stays with the assessor.
- **Voice input depends on the browser.** It works in Chrome, Edge and Safari. Other browsers fall back to typing.
- **Photos and answers are sent to Anthropic** to generate the foreman's replies. Tell students not to include faces or personal details in workshop photos, and check this against your organisation's privacy requirements.
- **Rate limits are per server.** Login attempts and AI requests are limited in memory on each server process.
