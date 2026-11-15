"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Composer } from "@/components/Composer";
import { CrossIcon, NextIcon } from "@/components/icons";
import { ActionBar, Button, ForemanSays, Kicker, LoadingScreen, Notice, Screen } from "@/components/ui";
import { api, ApiError, isAbort, messageOf, stream } from "@/lib/client/api";
import { days, money } from "@/lib/format";
import type { BuildLength, GameView, Quality } from "@/lib/game/types";
import type { StreamEvent } from "@/lib/stream-events";
import {
  Consequences,
  Hud,
  InspectionStamp,
  References,
  SiteFacts,
  SiteSheet,
  StageRail,
  TopBar,
  VerdictBanner,
  VerdictDot,
} from "./parts";

/** The foreman's words as they arrive, tagged with the screen they belong to. */
interface Talk {
  for: string | null;
  text: string;
  streaming: boolean;
}

const QUIET: Talk = { for: null, text: "", streaming: false };

/** An answer in the student's own words that the foreman is still weighing up. */
interface Attempt {
  text: string;
  verdict: Quality | "unclear" | null;
}

interface FollowUp {
  question: string;
  answer: string;
  streaming: boolean;
}

export function Game() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [view, setView] = useState<GameView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [talk, setTalk] = useState<Talk>(QUIET);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [asking, setAsking] = useState(false);
  const live = useRef<AbortController | null>(null);
  const siteSheet = useRef<HTMLDialogElement>(null);
  const screen = useRef<HTMLElement>(null);

  /** Run one streaming request at a time; starting a new one stops the last. */
  const openStream = useCallback(async (path: string, body: unknown, onEvent: (event: StreamEvent) => void) => {
    live.current?.abort();
    const abort = new AbortController();
    live.current = abort;
    try {
      await stream(path, body, onEvent, abort.signal);
    } finally {
      if (live.current === abort) live.current = null;
    }
  }, []);

  const startBriefing = useCallback(
    async (next: GameView) => {
      const key = `briefing:${next.stage?.id}`;
      setTalk({ for: key, text: "", streaming: true });
      try {
        await openStream(`/api/jobs/${id}/briefing`, {}, (event) => {
          if (event.t === "delta") setTalk((now) => (now.for === key ? { ...now, text: now.text + event.text } : now));
          else if (event.t === "reset") setTalk((now) => (now.for === key ? { ...now, text: "" } : now));
        });
      } catch (failure) {
        if (!isAbort(failure) && !(failure instanceof ApiError && failure.code === "stale")) {
          setError(messageOf(failure));
        }
      } finally {
        setTalk((now) => (now.for === key ? { ...now, streaming: false } : now));
      }
    },
    [id, openStream],
  );

  /** Show a new state of the job and do whatever that screen needs. */
  const enter = useCallback(
    (next: GameView) => {
      if (next.phase === "complete") {
        router.replace(`/jobs/${id}/scorecard`);
        return;
      }
      setView(next);
      setAttempt(null);
      setPicked(null);
      setFollowUps([]);
      setAsking(false);
      setTalk(QUIET);
      window.scrollTo(0, 0);
      if (next.phase === "stage_intro" && !next.briefing?.text) void startBriefing(next);
    },
    [id, router, startBriefing],
  );

  const reload = useCallback(async () => {
    const { view: fresh } = await api<{ view: GameView }>(`/api/jobs/${id}`);
    enter(fresh);
  }, [id, enter]);

  useEffect(() => {
    const abort = new AbortController();
    api<{ view: GameView }>(`/api/jobs/${id}`, { signal: abort.signal })
      .then(({ view: first }) => enter(first))
      .catch((failure) => {
        if (!isAbort(failure)) setError(messageOf(failure));
      });
    return () => {
      abort.abort();
      live.current?.abort();
    };
  }, [id, enter]);

  // Move keyboard and screen-reader focus to the heading of each new screen.
  const screenKey = view ? `${view.phase}:${view.stage?.id}:${view.decision?.id ?? view.result?.decisionId ?? ""}` : "";
  // (Looked up inside this screen only: earlier screens stay in the page in the background.)
  useEffect(() => {
    if (screenKey) screen.current?.querySelector<HTMLElement>("[data-screen-heading]")?.focus({ preventScroll: true });
  }, [screenKey]);

  /** Handle a failed request: if the job moved on elsewhere, just show where it's up to. */
  const recover = useCallback(
    async (failure: unknown) => {
      if (isAbort(failure)) return;
      if (failure instanceof ApiError && failure.code === "stale") {
        await reload().catch(() => setError(messageOf(failure)));
        return;
      }
      setError(messageOf(failure));
    },
    [reload],
  );

  async function post(path: string, body: unknown) {
    live.current?.abort();
    setBusy(true);
    setError(null);
    try {
      const { view: next } = await api<{ view: GameView }>(path, { body });
      enter(next);
    } catch (failure) {
      await recover(failure);
    } finally {
      setBusy(false);
    }
  }

  const start = (length: BuildLength) => post(`/api/jobs/${id}/start`, { length });
  const advance = () => post(`/api/jobs/${id}/advance`, { from: view?.phase });

  /** Events shared by both ways of answering. */
  function onAnswerEvent(key: string) {
    let shown = false;
    return (event: StreamEvent) => {
      switch (event.t) {
        case "delta":
          setTalk((now) => (now.for === key ? { ...now, text: now.text + event.text } : now));
          break;
        case "reset":
          setTalk((now) => (now.for === key ? { ...now, text: "" } : now));
          break;
        case "verdict":
          setAttempt((now) => (now ? { ...now, verdict: event.verdict } : now));
          break;
        case "view":
          setView(event.view);
          setPicked(null);
          if (event.view.phase === "feedback" && !shown) {
            // The first view is the verdict; a later one only adds the saved feedback.
            shown = true;
            setAttempt(null);
            window.scrollTo(0, 0);
          }
          break;
        case "error":
          setError(event.message);
          setAttempt(null);
          setTalk(QUIET);
          break;
      }
    };
  }

  async function answerTap(optionId: string) {
    if (!view?.decision || picked || talk.streaming) return;
    const key = view.decision.id;
    setError(null);
    setAttempt(null);
    setPicked(optionId);
    setTalk({ for: key, text: "", streaming: true });
    try {
      await openStream(`/api/jobs/${id}/answer`, { optionId, decisionId: key }, onAnswerEvent(key));
    } catch (failure) {
      setTalk(QUIET);
      await recover(failure);
    } finally {
      setPicked(null);
      setTalk((now) => (now.for === key ? { ...now, streaming: false } : now));
    }
  }

  async function answerOwnWords(text: string, mode: "voice" | "text") {
    if (!view?.decision || picked || talk.streaming) return;
    const key = view.decision.id;
    setError(null);
    setAttempt({ text, verdict: null });
    setTalk({ for: key, text: "", streaming: true });
    try {
      await openStream(`/api/jobs/${id}/answer`, { text, mode, decisionId: key }, onAnswerEvent(key));
    } catch (failure) {
      setAttempt(null);
      setTalk(QUIET);
      await recover(failure);
    } finally {
      setTalk((now) => (now.for === key ? { ...now, streaming: false } : now));
    }
  }

  async function ask(question: string) {
    setAsking(false);
    setError(null);
    setFollowUps((list) => [...list, { question, answer: "", streaming: true }]);
    const patchLast = (change: (item: FollowUp) => FollowUp) =>
      setFollowUps((list) => list.map((item, index) => (index === list.length - 1 ? change(item) : item)));
    try {
      await openStream(`/api/jobs/${id}/ask`, { question }, (event) => {
        if (event.t === "delta") patchLast((item) => ({ ...item, answer: item.answer + event.text }));
        else if (event.t === "error") setError(event.message);
      });
    } catch (failure) {
      await recover(failure);
    } finally {
      patchLast((item) => ({ ...item, streaming: false }));
      setFollowUps((list) => list.filter((item) => item.answer.trim()));
    }
  }

  if (!view) {
    return error ? (
      <Screen className="justify-center pb-10">
        <Notice>{error}</Notice>
      </Screen>
    ) : (
      <LoadingScreen label="Opening the job" />
    );
  }

  const title = `${view.site.lot} ${view.site.street}`;
  const chrome = (
    <>
      <TopBar jobId={view.id} stage={view.stage} onSite={() => siteSheet.current?.showModal()} />
      <SiteSheet dialog={siteSheet} title={`${title}, ${view.site.suburb}`} site={view.site} hud={view.hud} />
    </>
  );
  const problem = error ? (
    <div className="mt-3">
      <Notice>{error}</Notice>
    </div>
  ) : null;

  // ----- Site brief: the start of a new job -----
  if (view.phase === "brief") {
    return (
      <Screen ref={screen}>
        {chrome}
        <div className="mt-4 animate-rise">
          <Kicker>Your site</Kicker>
          <h1
            data-screen-heading
            tabIndex={-1}
            className="font-display text-[2.3rem] font-bold uppercase leading-[0.95] tracking-wide"
          >
            {title}
          </h1>
          <p className="mt-2 text-ink/75">
            This one&apos;s yours to run. Good calls keep the job on time and on budget. Poor ones cost money, days or a
            failed inspection.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-ink px-3.5 py-3 text-paper">
              <dt className="font-display text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-paper/65">
                Budget
              </dt>
              <dd className="font-display text-[1.75rem] font-bold leading-tight">{money(view.hud.budget)}</dd>
            </div>
            <div className="rounded-xl bg-ink px-3.5 py-3 text-paper">
              <dt className="font-display text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-paper/65">
                Program
              </dt>
              <dd className="font-display text-[1.75rem] font-bold leading-tight">{view.hud.programDays} days</dd>
            </div>
          </dl>
          <div className="mt-3">
            <SiteFacts site={view.site} hud={view.hud} />
          </div>
        </div>
        {problem}
        <div className="h-6" />
        <ActionBar>
          <div className="flex flex-col items-end gap-2">
            <p className="font-display text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
              How long have you got?
            </p>
            <div className="flex flex-wrap justify-end gap-2.5">
              <Button variant="secondary" disabled={busy} onClick={() => start("quick")}>
                Quick 15 min
              </Button>
              <Button className="px-5" disabled={busy} onClick={() => start("full")}>
                Full 30 min
              </Button>
            </div>
          </div>
        </ActionBar>
      </Screen>
    );
  }

  // ----- Stage briefing -----
  if (view.phase === "stage_intro" && view.stage) {
    const key = `briefing:${view.stage.id}`;
    const words = view.briefing?.text ?? (talk.for === key ? talk.text : "");
    const streaming = !view.briefing?.text && talk.for === key && talk.streaming;
    return (
      <Screen ref={screen}>
        {chrome}
        <div className="mt-5 animate-rise">
          <p className="font-display text-[5.5rem] font-bold leading-[0.8] text-accent" aria-hidden="true">
            {String(view.stage.n).padStart(2, "0")}
          </p>
          <h1
            data-screen-heading
            tabIndex={-1}
            className="mt-2 font-display text-[3rem] font-bold uppercase leading-[0.9] tracking-wide"
          >
            {view.stage.name}
          </h1>
          <p className="mt-2 text-[1.1rem] text-ink/70">{view.stage.blurb}</p>
        </div>
        <div className="mt-6">
          <Hud hud={view.hud} />
        </div>
        <div className="mt-6 pb-6">
          <ForemanSays text={words} streaming={streaming} />
        </div>
        {problem}
        <ActionBar>
          <Button disabled={busy} onClick={advance}>
            Let&apos;s go <NextIcon />
          </Button>
        </ActionBar>
      </Screen>
    );
  }

  // ----- A decision waiting for an answer -----
  if (view.phase === "decision" && view.decision) {
    const decision = view.decision;
    const weighing = talk.for === decision.id && talk.streaming;
    const locked = busy || Boolean(picked) || weighing;
    return (
      <Screen ref={screen}>
        {chrome}
        <div className="mt-3">
          <Hud hud={view.hud} />
        </div>
        <div key={decision.id} className="mt-5 animate-rise">
          <Kicker tone={decision.kind === "event" ? "accent" : "ink"}>
            {decision.kind === "event" ? "Site event" : `Decision ${decision.n} of ${decision.of}`}
          </Kicker>
          <h1
            data-screen-heading
            tabIndex={-1}
            className="font-display text-[2rem] font-bold uppercase leading-[0.98] tracking-wide"
          >
            {decision.title}
          </h1>
          <p className="mt-3 text-[1.06rem] leading-relaxed">{decision.situation}</p>
          <p className="mt-3 text-[1.15rem] font-semibold leading-snug">{decision.question}</p>
        </div>

        {attempt ? (
          <div className="mt-5 space-y-3 rounded-2xl border border-ink/12 bg-card p-4">
            <div>
              <Kicker tone="ink">You said</Kicker>
              <p className="text-ink/80">“{attempt.text}”</p>
            </div>
            <ForemanSays text={talk.for === decision.id ? talk.text : ""} streaming={weighing} />
          </div>
        ) : null}
        {problem}

        <div className="mt-5 grid grid-cols-[1.75rem_1fr] gap-3 pb-6">
          <StageRail stages={view.stages} />
          <ol className="space-y-2.5">
            {decision.options.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => answerTap(option.id)}
                  className={`flex min-h-[4.25rem] w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-transform duration-100 active:scale-[0.985] disabled:pointer-events-none ${
                    picked === option.id
                      ? "border-accent bg-accent/10"
                      : `border-ink/20 bg-card ${locked ? "opacity-50" : ""}`
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-[1.2rem] font-semibold ${
                      picked === option.id ? "bg-accent text-white" : "border-2 border-ink/25 text-ink/70"
                    }`}
                    aria-hidden="true"
                  >
                    {"ABCD"[index]}
                  </span>
                  <span className="text-[1.02rem] leading-snug">{option.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {view.aiEnabled ? (
          <ActionBar>
            <Composer
              key={decision.id}
              disabled={locked}
              placeholder="Say or type your own answer"
              onSubmit={answerOwnWords}
            />
          </ActionBar>
        ) : null}
      </Screen>
    );
  }

  // ----- Feedback on the call just made -----
  if (view.phase === "feedback" && view.result) {
    const result = view.result;
    const mine = talk.for === result.decisionId;
    const words = mine && (talk.text || talk.streaming) ? talk.text : result.feedback;
    const streaming = mine && talk.streaming;
    const fromAi = mine && talk.text ? true : result.aiFeedback;
    return (
      <Screen ref={screen}>
        {chrome}
        <div className="mt-3">
          <VerdictBanner quality={result.quality} />
        </div>
        <div className="mt-4 space-y-4 pb-6">
          <div>
            <Kicker tone="ink">
              {result.kind === "event" ? "Site event" : `Decision ${result.n} of ${result.of}`} · {result.title}
            </Kicker>
            <p className="mt-1 text-ink/75">
              {result.mode === "tap" ? "You chose: " : "You said: "}“{result.answer}”
            </p>
          </div>
          <div className="space-y-2">
            <Consequences
              cost={result.cost}
              days={result.days}
              inspectionFail={result.inspectionFail}
              safety={result.safety}
            />
            <p className="leading-snug">{result.outcome}</p>
          </div>

          <ForemanSays
            text={words}
            streaming={streaming}
            note={fromAi ? undefined : "From the course notes."}
          />

          {result.quality !== "good" && result.bestCall ? (
            <div className="rounded-xl border-l-4 border-good bg-good/8 px-3.5 py-2.5">
              <Kicker tone="ink">The right call</Kicker>
              <p className="leading-snug">{result.bestCall}</p>
            </div>
          ) : null}

          <References refs={result.refs} />

          {followUps.map((item, index) => (
            <div key={index} className="space-y-2 rounded-2xl border border-ink/12 bg-card p-4">
              <div>
                <Kicker tone="ink">You asked</Kicker>
                <p className="text-ink/80">“{item.question}”</p>
              </div>
              <ForemanSays text={item.answer} streaming={item.streaming} />
            </div>
          ))}
          {problem}
          <Hud hud={view.hud} />
        </div>

        <ActionBar>
          {asking ? (
            <div className="flex min-w-0 flex-1 items-end gap-2">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAsking(false)}
                className="flex size-12 shrink-0 items-center justify-center self-center rounded-full text-ink/60"
              >
                <CrossIcon />
              </button>
              <Composer
                placeholder="Say or type your question"
                sendLabel="Ask the foreman"
                maxLength={400}
                onSubmit={(question) => void ask(question)}
              />
            </div>
          ) : (
            <>
              {view.aiEnabled ? (
                <Button
                  variant="secondary"
                  disabled={busy || streaming || followUps.some((item) => item.streaming)}
                  onClick={() => setAsking(true)}
                >
                  Ask why
                </Button>
              ) : null}
              <Button disabled={busy} onClick={advance}>
                Next <NextIcon />
              </Button>
            </>
          )}
        </ActionBar>
      </Screen>
    );
  }

  // ----- End of a stage -----
  if (view.phase === "stage_done" && view.stageSummary) {
    const summary = view.stageSummary;
    return (
      <Screen ref={screen}>
        {chrome}
        <div className="mt-5 animate-rise">
          <Kicker>Stage {summary.stage.n} of 8 done</Kicker>
          <h1
            data-screen-heading
            tabIndex={-1}
            className="font-display text-[3rem] font-bold uppercase leading-[0.9] tracking-wide"
          >
            {summary.stage.name}
          </h1>
        </div>

        {summary.inspection ? (
          <div className="mt-5">
            <InspectionStamp name={summary.inspection.name} passed={summary.inspection.passed} />
          </div>
        ) : null}

        <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {summary.items.map((item) => (
            <li key={item.title} className="flex items-center gap-3 py-3">
              <VerdictDot quality={item.quality} />
              <span className="flex-1 leading-snug">{item.title}</span>
              <span className={`shrink-0 text-right text-[0.95rem] ${item.cost + item.days > 0 ? "text-bad" : "text-ink/45"}`}>
                {item.cost > 0 ? `+${money(item.cost)}` : ""}
                {item.cost > 0 && item.days > 0 ? " · " : ""}
                {item.days > 0 ? `+${days(item.days)}` : ""}
                {item.cost + item.days === 0 ? "no cost" : ""}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 pb-6">
          <Hud hud={view.hud} />
        </div>
        {problem}
        <ActionBar>
          <Button disabled={busy} onClick={advance}>
            {summary.isLast ? "See the debrief" : "Next stage"} <NextIcon />
          </Button>
        </ActionBar>
      </Screen>
    );
  }

  return <LoadingScreen label="Opening the job" />;
}
