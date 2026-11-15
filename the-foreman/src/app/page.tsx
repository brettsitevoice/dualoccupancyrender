"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CameraIcon, ChevronIcon } from "@/components/icons";
import { ActionBar, Button, buttonClass, Kicker, LoadingScreen, Notice, Screen, Wordmark } from "@/components/ui";
import { api, hardNavigate, isAbort, messageOf } from "@/lib/client/api";
import { shortDate } from "@/lib/format";
import type { JobSummary } from "@/lib/game/types";

interface HomeData {
  user: { id: string; name: string; email: string };
  jobs: JobSummary[];
  aiEnabled: boolean;
}

function JobCard({ job }: { job: JobSummary }) {
  const done = job.status === "complete";
  return (
    <Link
      href={done ? `/jobs/${job.id}/scorecard` : `/jobs/${job.id}`}
      className="flex min-h-[4.75rem] items-center gap-3 rounded-2xl border-2 border-ink/15 bg-card py-3 pl-4 pr-3 transition-transform duration-100 active:scale-[0.985]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{job.title}</p>
        <p className="mt-0.5 text-[0.93rem] text-ink/60">
          {done
            ? `Handed over ${shortDate(job.updatedAt)}`
            : job.stageName
              ? `Stage ${job.stageN} of 8 · ${job.stageName}`
              : "Not started yet"}
        </p>
      </div>
      {done && job.overall !== null ? (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[1.35rem] font-bold text-paper">
          {job.overall}
        </span>
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <ChevronIcon />
        </span>
      )}
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    api<HomeData>("/api/jobs", { signal: abort.signal })
      .then((fresh) => {
        setData(fresh);
        setError(null);
      })
      .catch((failure) => {
        if (!isAbort(failure)) setError(messageOf(failure));
      });
    return () => abort.abort();
  }, []);

  async function newBuild() {
    setStarting(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/jobs", { method: "POST", body: {} });
      router.push(`/jobs/${id}`);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      // This screen stays alive in the background after navigating, so don't
      // leave the button stuck in its busy state.
      setStarting(false);
    }
  }

  async function signOut() {
    await api("/api/auth/logout", { method: "POST", body: {} }).catch(() => undefined);
    hardNavigate("/login");
  }

  if (!data) {
    return error ? (
      <Screen className="justify-center pb-10">
        <Notice>{error}</Notice>
      </Screen>
    ) : (
      <LoadingScreen />
    );
  }

  const active = data.jobs.filter((job) => job.status === "active");
  const finished = data.jobs.filter((job) => job.status === "complete");

  return (
    <Screen>
      <header className="flex items-center justify-between">
        <Wordmark />
        <Button variant="quiet" onClick={signOut}>
          Sign out
        </Button>
      </header>

      <h1 data-screen-heading className="mt-7 font-display text-[2.4rem] font-bold uppercase leading-[0.95] tracking-wide">
        G&apos;day, {data.user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-ink/70">
        {active.length > 0 ? "Pick up where you left off, or start a new build." : "Ready to run a job? Start a new build."}
      </p>

      <div className="mt-6 space-y-7 pb-6">
        {error ? <Notice>{error}</Notice> : null}
        {!data.aiEnabled ? (
          <Notice tone="info">
            The AI foreman is offline, so you&apos;ll get the built-in notes for now. You can still run a build by tapping
            your answers.
          </Notice>
        ) : null}

        {active.length > 0 ? (
          <section>
            <Kicker>On the tools</Kicker>
            <div className="mt-2 space-y-2.5">
              {active.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        ) : null}

        {finished.length > 0 ? (
          <section>
            <Kicker tone="ink">Handed over</Kicker>
            <div className="mt-2 space-y-2.5">
              {finished.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        ) : null}

        {data.jobs.length === 0 ? (
          <section className="rounded-2xl border-2 border-dashed border-ink/20 px-4 py-6">
            <p className="font-display text-[1.5rem] font-semibold uppercase leading-tight tracking-wide">
              How it works
            </p>
            <p className="mt-2 text-ink/75">
              You get a block of land, a budget and a program. The foreman walks you through eight stages and asks what
              you&apos;d do. Good calls keep the job on time and on budget. Poor ones cost money, days or a failed
              inspection.
            </p>
          </section>
        ) : null}
      </div>

      <ActionBar>
        <Link href="/photo" className={buttonClass("secondary")}>
          <CameraIcon />
          Photo check
        </Link>
        <Button onClick={newBuild} disabled={starting}>
          {starting ? "Finding a site…" : "New build"}
        </Button>
      </ActionBar>
    </Screen>
  );
}
