"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VerdictDot } from "@/components/game/parts";
import { BackIcon, CameraIcon, DownloadIcon } from "@/components/icons";
import { ActionBar, Button, buttonClass, ForemanSays, Kicker, LoadingScreen, Notice, Screen, Wordmark } from "@/components/ui";
import { api, ApiError, isAbort, messageOf, stream } from "@/lib/client/api";
import { days, money, shortDate, VERDICT_LABEL } from "@/lib/format";
import type { BuildLength, Debrief, PhotoReviewView, Scorecard, Site } from "@/lib/game/types";

interface ScorecardData {
  id: string;
  title: string;
  student: string;
  site: Site;
  length: BuildLength | null;
  startedAt: string | null;
  completedAt: string | null;
  card: Scorecard;
  debrief: Debrief | null;
  photos: PhotoReviewView[];
}

function ScoreTile({ label, score, detail }: { label: string; score: number; detail: string }) {
  const tone = score >= 75 ? "bg-good" : score >= 50 ? "bg-warn" : "bg-bad";
  return (
    <div className="rounded-2xl border border-ink/12 bg-card p-3.5 print:break-inside-avoid">
      <p className="font-display text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-ink/60">{label}</p>
      <p className="font-display text-[2.6rem] font-bold leading-none">{score}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-[0.9rem] leading-snug text-ink/70">{detail}</p>
    </div>
  );
}

/** The debrief at the end of a build: scores, the foreman's wrap-up, and the unit mapping. */
export function ScorecardScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ScorecardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<{ text: string; streaming: boolean; ai: boolean }>({
    text: "",
    streaming: false,
    ai: false,
  });
  const [open, setOpen] = useState<string | null>(null);
  const live = useRef<AbortController | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    live.current = abort;

    async function load() {
      const loaded = await api<ScorecardData>(`/api/jobs/${id}/scorecard`, { signal: abort.signal });
      setData(loaded);
      if (loaded.debrief) {
        setDebrief({ text: loaded.debrief.text, streaming: false, ai: loaded.debrief.ai });
        return;
      }
      // First visit: the foreman gives his debrief, and it's saved with the job.
      setDebrief({ text: "", streaming: true, ai: false });
      let ai = false;
      try {
        await stream(
          `/api/jobs/${id}/debrief`,
          {},
          (event) => {
            if (event.t === "delta") setDebrief((now) => ({ ...now, text: now.text + event.text }));
            else if (event.t === "reset") setDebrief((now) => ({ ...now, text: "" }));
            else if (event.t === "done") ai = event.ai;
          },
          abort.signal,
        );
      } finally {
        setDebrief((now) => ({ ...now, streaming: false, ai }));
      }
    }

    load().catch((failure) => {
      if (isAbort(failure)) return;
      if (failure instanceof ApiError && failure.code === "not_complete") {
        router.replace(`/jobs/${id}`);
        return;
      }
      setError(messageOf(failure));
    });
    return () => abort.abort();
  }, [id, router]);

  if (!data) {
    return error ? (
      <Screen className="justify-center pb-10">
        <Notice>{error}</Notice>
      </Screen>
    ) : (
      <LoadingScreen label="Adding it up" />
    );
  }

  const { card } = data;

  return (
    <Screen>
      <header className="-mx-2 flex items-center print:hidden">
        <Link href="/" aria-label="Back to your jobs" className="flex size-12 items-center justify-center rounded-full text-ink/75">
          <BackIcon />
        </Link>
        <p className="font-display text-[1.3rem] font-semibold uppercase leading-none tracking-[0.1em]">Build debrief</p>
      </header>
      <div className="hidden print:block">
        <Wordmark />
      </div>

      <div className="mt-3 space-y-6 pb-6">
        <div>
          <Kicker>Handed over</Kicker>
          <h1
            data-screen-heading
            tabIndex={-1}
            className="font-display text-[2.2rem] font-bold uppercase leading-[0.95] tracking-wide"
          >
            {data.title}
          </h1>
          <p className="mt-1.5 text-[0.97rem] text-ink/65">
            {data.student} · {shortDate(data.completedAt)} · {data.length === "quick" ? "Quick build" : "Full build"},{" "}
            {card.decisions.total} decisions
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-ink p-4 text-paper print:break-inside-avoid print:border-2 print:border-ink print:bg-white print:text-ink">
          <div>
            <p className="font-display text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-paper/65 print:text-ink/60">
              Overall
            </p>
            <p className="font-display text-[1.7rem] font-bold uppercase leading-tight tracking-wide">
              {card.rating.label}
            </p>
            <p className="mt-0.5 text-[0.95rem] leading-snug text-paper/80 print:text-ink/75">{card.rating.note}</p>
          </div>
          <p className="font-display text-[4.2rem] font-bold leading-none text-accent">{card.overall}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <ScoreTile
            label="Cost"
            score={card.cost.score}
            detail={card.cost.over > 0 ? `${money(card.cost.over)} over budget` : `${money(-card.cost.over)} under budget`}
          />
          <ScoreTile
            label="Time"
            score={card.time.score}
            detail={card.time.over > 0 ? `${days(card.time.over)} late` : `${days(-card.time.over)} early`}
          />
          <ScoreTile
            label="Compliance"
            score={card.compliance.score}
            detail={`${card.compliance.failedInspections} failed inspections, ${card.compliance.safetyBreaches} safety breaches`}
          />
          <ScoreTile
            label="Decisions"
            score={card.decisions.score}
            detail={`${card.decisions.good} right, ${card.decisions.partial} partly, ${card.decisions.poor} wrong`}
          />
        </div>

        <ForemanSays
          text={debrief.text}
          streaming={debrief.streaming}
          label="Foreman's debrief"
          note={debrief.ai ? undefined : "From your results."}
        />

        <section>
          <Kicker>Units of competency</Kicker>
          <p className="text-[0.97rem] text-ink/65">CPC30220 Certificate III in Carpentry</p>
          <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
            {card.units.map((unit) => (
              <li key={unit.code} className="py-3 print:break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-[1.15rem] font-semibold tracking-wide">
                    {unit.code}
                    {unit.elective ? <span className="ml-2 text-[0.85rem] uppercase text-ink/50">elective</span> : null}
                  </p>
                  <p className="shrink-0 text-[0.95rem] text-ink/70">
                    {unit.points} of {unit.decisions}
                  </p>
                </div>
                <p className="text-[0.97rem] leading-snug text-ink/80">{unit.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.round((unit.points / unit.decisions) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink/55">
            Sound decisions out of decisions made (a partly right call counts as half). This is supporting evidence of
            your knowledge. Your assessor decides competency.
          </p>
        </section>

        <section>
          <Kicker>Decision record</Kicker>
          <div className="mt-2 space-y-2.5">
            {card.stages
              .filter((stage) => stage.items.length > 0)
              .map((stage) => {
                const expanded = open === stage.id;
                return (
                  <div key={stage.id} className="rounded-2xl border border-ink/12 bg-card">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : stage.id)}
                      className="flex min-h-14 w-full items-center gap-3 px-3.5 text-left"
                    >
                      <span className="flex-1 font-display text-[1.25rem] font-semibold uppercase tracking-wide">
                        {stage.name}
                      </span>
                      <span className="flex gap-1">
                        {stage.items.map((entry) => (
                          <VerdictDot key={entry.decisionId} quality={entry.quality} />
                        ))}
                      </span>
                    </button>
                    <ul className={`${expanded ? "" : "hidden"} divide-y divide-ink/10 border-t border-ink/10 px-3.5 print:block`}>
                      {stage.items.map((entry) => (
                        <li key={entry.decisionId} className="space-y-1.5 py-3 print:break-inside-avoid">
                          <p className="font-semibold leading-snug">
                            {entry.title}
                            <span className="ml-2 text-[0.9rem] font-normal text-ink/60">
                              {VERDICT_LABEL[entry.quality]}
                            </span>
                          </p>
                          <p className="text-[0.95rem] text-ink/75">
                            {entry.mode === "tap" ? "You chose: " : "You said: "}“{entry.answer}”
                          </p>
                          <p className="text-[0.95rem]">{entry.outcome}</p>
                          <p className="text-[0.95rem] text-ink/75">{entry.feedback}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </section>

        <section className="print:break-inside-avoid">
          <Kicker>Workshop photo checks</Kicker>
          {data.photos.length === 0 ? (
            <p className="mt-1 text-[0.97rem] text-ink/65">
              None yet. Add a photo of your practical work to include it in your evidence.
            </p>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {data.photos.map((photo) => (
                <li key={photo.id}>
                  <Link
                    href={`/photo/${photo.id}?job=${data.id}`}
                    className="flex items-center gap-3 rounded-2xl border-2 border-ink/15 bg-card p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a small stored preview */}
                    <img src={photo.image} alt="" className="size-16 rounded-xl object-cover" />
                    <span className="flex-1 leading-snug">
                      <span className="block font-semibold">{photo.task}</span>
                      <span className="line-clamp-2 text-[0.92rem] text-ink/65">{photo.feedback}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end print:hidden">
            <Link href={`/photo?job=${data.id}`} className={buttonClass("secondary", "min-h-14")}>
              <CameraIcon />
              Add a photo
            </Link>
          </div>
        </section>
      </div>

      <ActionBar>
        <a href={`/api/jobs/${data.id}/export`} download className={buttonClass("secondary")}>
          <DownloadIcon />
          Download
        </a>
        <Button onClick={() => window.print()}>Save as PDF</Button>
      </ActionBar>
    </Screen>
  );
}
