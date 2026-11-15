import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { BackIcon, CameraIcon, CheckIcon, CrossIcon, HalfIcon, PlansIcon } from "@/components/icons";
import { Button, Kicker } from "@/components/ui";
import { days, money, VERDICT_LABEL } from "@/lib/format";
import type { HudView, Quality, Site, StageView } from "@/lib/game/types";

const ICON_BUTTON =
  "flex size-12 items-center justify-center rounded-full text-ink/75 transition-transform duration-100 active:scale-90";

/** Top of the game screen: back to jobs on the left, site details and photo check on the right. */
export function TopBar({
  jobId,
  stage,
  onSite,
}: {
  jobId: string;
  stage: StageView | null;
  onSite: () => void;
}) {
  return (
    <header className="-mx-2 flex items-center print:hidden">
      <Link href="/" aria-label="Back to your jobs" className={ICON_BUTTON}>
        <BackIcon />
      </Link>
      <p className="flex-1 font-display text-[1.3rem] font-semibold uppercase leading-none tracking-[0.1em]">
        {stage ? (
          <>
            <span className="text-accent-deep">{String(stage.n).padStart(2, "0")}</span>
            <span className="text-ink/35"> / 08 </span>
            {stage.name}
          </>
        ) : (
          "New job"
        )}
      </p>
      <Link href={`/photo?job=${jobId}`} aria-label="Send a workshop photo" className={ICON_BUTTON}>
        <CameraIcon />
      </Link>
      <button type="button" aria-label="Site details" className={ICON_BUTTON} onClick={onSite}>
        <PlansIcon />
      </button>
    </header>
  );
}

/** Where the job stands on money and time. */
export function Hud({ hud }: { hud: HudView }) {
  const overBudget = hud.costOver > 0;
  const behind = hud.daysOver > 0;
  return (
    <dl className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-ink/12 bg-card px-3 py-2">
        <dt className="font-display text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink/55">Budget</dt>
        <dd className={`font-display text-[1.45rem] font-semibold leading-tight ${overBudget ? "text-bad" : ""}`}>
          {money(Math.abs(hud.costOver))}
          <span className="block font-sans text-[0.82rem] font-normal leading-tight text-ink/60">
            {overBudget ? "over budget" : "contingency left"}
          </span>
        </dd>
      </div>
      <div className="rounded-xl border border-ink/12 bg-card px-3 py-2">
        <dt className="font-display text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
          Program · day {hud.dayNow}
        </dt>
        <dd className={`font-display text-[1.45rem] font-semibold leading-tight ${behind ? "text-bad" : ""}`}>
          {days(Math.abs(hud.daysOver))}
          <span className="block font-sans text-[0.82rem] font-normal leading-tight text-ink/60">
            {behind ? "behind program" : "float left"}
          </span>
        </dd>
      </div>
    </dl>
  );
}

/** Progress through the eight stages, drawn up the left-hand side beside the answer buttons. */
export function StageRail({ stages }: { stages: StageView[] }) {
  const current = stages.find((stage) => stage.status === "current");
  return (
    <div className="relative flex w-7 flex-col items-center justify-between py-2" aria-hidden="true">
      <span className="absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2 bg-ink/12" />
      {stages.map((stage) => (
        <span
          key={stage.id}
          className={`relative rounded-full ${
            stage.status === "done"
              ? "size-2.5 bg-ink"
              : stage.status === "current"
                ? "size-4 bg-accent ring-4 ring-accent/25"
                : "size-2.5 border-2 border-ink/25 bg-paper"
          }`}
        />
      ))}
      <span className="sr-only">{current ? `Stage ${current.n} of 8` : ""}</span>
    </div>
  );
}

const VERDICT_STYLE: Record<Quality, { box: string; icon: ReactNode }> = {
  good: { box: "border-good bg-good/10 text-good", icon: <CheckIcon width={30} height={30} strokeWidth={3} /> },
  partial: { box: "border-warn bg-warn/10 text-warn", icon: <HalfIcon width={30} height={30} strokeWidth={3} /> },
  poor: { box: "border-bad bg-bad/10 text-bad", icon: <CrossIcon width={30} height={30} strokeWidth={3} /> },
};

export function VerdictBanner({ quality }: { quality: Quality }) {
  const style = VERDICT_STYLE[quality];
  return (
    <div className={`flex animate-rise items-center gap-3 rounded-2xl border-l-[6px] px-4 py-3 ${style.box}`}>
      {style.icon}
      <h1
        data-screen-heading
        tabIndex={-1}
        className="font-display text-[2.1rem] font-bold uppercase leading-none tracking-wide"
      >
        {VERDICT_LABEL[quality]}
      </h1>
    </div>
  );
}

export function VerdictDot({ quality }: { quality: Quality }) {
  const colour = quality === "good" ? "bg-good" : quality === "partial" ? "bg-warn" : "bg-bad";
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${colour}`}>
      {quality === "good" ? (
        <CheckIcon width={15} height={15} strokeWidth={3.5} />
      ) : quality === "partial" ? (
        <HalfIcon width={15} height={15} strokeWidth={3.5} />
      ) : (
        <CrossIcon width={15} height={15} strokeWidth={3.5} />
      )}
      <span className="sr-only">{VERDICT_LABEL[quality]}</span>
    </span>
  );
}

function Chip({ children, tone }: { children: ReactNode; tone: "bad" | "ok" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 font-display text-[1.05rem] font-semibold uppercase tracking-wide ${
        tone === "bad" ? "bg-bad text-white" : "bg-ink/8 text-ink/75"
      }`}
    >
      {children}
    </span>
  );
}

/** What the call cost the job. */
export function Consequences({
  cost,
  days: lost,
  inspectionFail,
  safety,
}: {
  cost: number;
  days: number;
  inspectionFail: boolean;
  safety: boolean;
}) {
  const clean = cost === 0 && lost === 0 && !inspectionFail && !safety;
  return (
    <div className="flex flex-wrap gap-2">
      {clean ? <Chip tone="ok">No cost · no delay</Chip> : null}
      {cost > 0 ? <Chip tone="bad">+{money(cost)}</Chip> : null}
      {lost > 0 ? <Chip tone="bad">+{days(lost)}</Chip> : null}
      {inspectionFail ? <Chip tone="bad">Failed inspection</Chip> : null}
      {safety ? <Chip tone="bad">Safety breach</Chip> : null}
    </div>
  );
}

/** A rubber stamp for the stage's critical inspection. */
export function InspectionStamp({ name, passed }: { name: string; passed: boolean }) {
  return (
    <div
      className={`inline-block -rotate-2 rounded-lg border-[3px] px-4 py-2 ${passed ? "border-good text-good" : "border-bad text-bad"}`}
    >
      <p className="font-display text-[0.9rem] font-semibold uppercase tracking-[0.14em]">{name}</p>
      <p className="font-display text-[2rem] font-bold uppercase leading-none tracking-wider">
        {passed ? "Passed" : "Failed first go"}
      </p>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-2.5">
      <dt className="shrink-0 font-display text-[1rem] font-semibold uppercase tracking-[0.1em] text-ink/55">
        {label}
      </dt>
      <dd className="text-right leading-snug">{children}</dd>
    </div>
  );
}

/** The site's conditions, as they'd appear on the cover sheet of the plans. */
export function SiteFacts({ site, hud }: { site: Site; hud: HudView }) {
  return (
    <dl>
      <Fact label="Where">
        {site.suburb}, {site.region}
      </Fact>
      <Fact label="Block">
        {site.lotWidth} m x {site.lotDepth} m, falls {site.fall} m {site.fallDirection}
      </Fact>
      <Fact label="Soil">
        Class {site.soilClass}: {site.soilNote}
      </Fact>
      <Fact label="Wind">{site.windClass}</Fact>
      <Fact label="Bushfire">{site.bal}</Fact>
      <Fact label="Climate zone">{site.climateZone}</Fact>
      {site.coastKm !== null ? <Fact label="Coast">{Math.round(site.coastKm * 1000)} m from the surf</Fact> : null}
      <Fact label="House">
        {site.houseArea} m², {site.bedrooms} bed, single-storey brick veneer on a raft slab
      </Fact>
      <Fact label="Roof">
        {site.roof}, {site.roofPitch}° pitch
      </Fact>
      <Fact label="Start">{site.startMonth}</Fact>
      <Fact label="Budget">
        {money(hud.budget)}
        <span className="block text-[0.9rem] text-ink/60">includes {money(hud.contingency)} contingency</span>
      </Fact>
      <Fact label="Program">
        {hud.programDays} working days
        <span className="block text-[0.9rem] text-ink/60">includes {days(hud.floatDays)} of float</span>
      </Fact>
    </dl>
  );
}

/** Site details as a sheet that slides up from the bottom. */
export function SiteSheet({
  dialog,
  title,
  site,
  hud,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
  title: string;
  site: Site;
  hud: HudView;
}) {
  return (
    <dialog
      ref={dialog}
      aria-label="Site details"
      className="m-0 mx-auto mt-auto max-h-[88dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-3xl bg-paper p-0 text-ink"
    >
      <div className="px-5 pt-5">
        <Kicker>The site</Kicker>
        <h2 className="font-display text-[1.7rem] font-bold uppercase leading-tight tracking-wide">{title}</h2>
        <div className="mt-2">
          <SiteFacts site={site} hud={hud} />
        </div>
      </div>
      <div className="sticky bottom-0 flex justify-end bg-paper/95 px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" onClick={() => dialog.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  );
}

/** Collapsible list of the standards behind an answer. */
export function References({ refs }: { refs: string[] }) {
  return (
    <details className="group rounded-xl border border-ink/12 bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3.5 font-display text-[1.05rem] font-semibold uppercase tracking-[0.1em] text-ink/70 [&::-webkit-details-marker]:hidden">
        What the rules say
        <span className="text-[1.4rem] leading-none text-accent-deep group-open:hidden">+</span>
        <span className="hidden text-[1.4rem] leading-none text-accent-deep group-open:inline">−</span>
      </summary>
      <ul className="space-y-1.5 px-3.5 pb-3 text-[0.95rem] text-ink/80">
        {refs.map((ref) => (
          <li key={ref} className="border-l-2 border-accent/60 pl-2.5">
            {ref}
          </li>
        ))}
      </ul>
    </details>
  );
}
