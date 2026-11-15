"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Composer } from "@/components/Composer";
import { BackIcon, CameraIcon } from "@/components/icons";
import { ActionBar, Button, buttonClass, ForemanSays, Kicker, LoadingScreen, Notice, Screen } from "@/components/ui";
import { api, isAbort, messageOf, stream } from "@/lib/client/api";
import { preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { shortDate } from "@/lib/format";
import type { PhotoReviewView } from "@/lib/game/types";

const TASKS = ["Wall frame", "Roof framing", "Formwork", "Set-out", "Door or window", "Stairs", "Lining or trim"];

interface Talk {
  step: "look" | "feedback" | null;
  text: string;
  streaming: boolean;
}

const QUIET: Talk = { step: null, text: "", streaming: false };

/**
 * Workshop photo check. The student sends a photo of their practical work.
 * The foreman says what he sees and asks them to explain their reasoning,
 * then gives feedback once they have.
 */
export function PhotoCheck({ reviewId }: { reviewId?: string }) {
  const params = useSearchParams();
  const jobId = params.get("job");
  const backHref = jobId ? `/jobs/${jobId}` : "/";

  const [review, setReview] = useState<PhotoReviewView | null>(null);
  const [past, setPast] = useState<PhotoReviewView[] | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(Boolean(reviewId));
  const [task, setTask] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [talk, setTalk] = useState<Talk>(QUIET);
  const [error, setError] = useState<string | null>(null);
  const live = useRef<AbortController | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const taskId = useId();
  const noteId = useId();

  useEffect(() => {
    const abort = new AbortController();
    const request = reviewId
      ? api<{ review: PhotoReviewView }>(`/api/photo/${reviewId}`, { signal: abort.signal }).then((data) => {
          setReview(data.review);
          setAiEnabled(data.review.aiEnabled);
        })
      : api<{ photos: PhotoReviewView[]; aiEnabled: boolean }>("/api/photo", { signal: abort.signal }).then(
          (data) => {
            setPast(data.photos);
            setAiEnabled(data.aiEnabled);
          },
        );
    request
      .catch((failure) => {
        if (!isAbort(failure)) setError(messageOf(failure));
      })
      .finally(() => setLoading(false));
    return () => {
      abort.abort();
      live.current?.abort();
    };
  }, [reviewId]);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      setPhoto(await preparePhoto(file));
    } catch {
      setError("That photo couldn't be read. Try taking it again.");
    } finally {
      setPreparing(false);
    }
  }

  async function run(step: "look" | "feedback", path: string, body: unknown) {
    live.current?.abort();
    const abort = new AbortController();
    live.current = abort;
    setError(null);
    setTalk({ step, text: "", streaming: true });
    try {
      await stream(
        path,
        body,
        (event) => {
          if (event.t === "delta") setTalk((now) => ({ ...now, text: now.text + event.text }));
          else if (event.t === "photo") setReview(event.review);
          else if (event.t === "error") setError(event.message);
        },
        abort.signal,
      );
    } catch (failure) {
      if (!isAbort(failure)) setError(messageOf(failure));
    } finally {
      if (live.current === abort) live.current = null;
      setTalk(QUIET);
    }
  }

  function send() {
    if (!photo || !task.trim()) return;
    window.scrollTo(0, 0);
    // Show the photo straight away while it uploads.
    setReview({
      id: "",
      jobId,
      task: task.trim(),
      note: note.trim(),
      image: photo.preview,
      observations: "",
      reasoning: "",
      feedback: "",
      status: "awaiting_reasoning",
      aiEnabled: true,
      createdAt: new Date().toISOString(),
    });
    void run("look", "/api/photo", { image: photo.image, thumb: photo.thumb, task, note, jobId });
  }

  /** Back to an empty form for the next photo. */
  function startOver() {
    setReview(null);
    setPhoto(null);
    setTask("");
    setNote("");
    setError(null);
    window.scrollTo(0, 0);
    api<{ photos: PhotoReviewView[]; aiEnabled: boolean }>("/api/photo")
      .then((data) => setPast(data.photos))
      .catch(() => undefined);
  }

  if (loading) return <LoadingScreen label="Opening" />;

  const header = (
    <header className="-mx-2 flex items-center print:hidden">
      <Link href={backHref} aria-label="Back" className="flex size-12 items-center justify-center rounded-full text-ink/75">
        <BackIcon />
      </Link>
      <p className="font-display text-[1.3rem] font-semibold uppercase leading-none tracking-[0.1em]">Photo check</p>
    </header>
  );

  // ----- A photo check in progress, or a finished one -----
  if (review) {
    const looking = talk.step === "look";
    const responding = talk.step === "feedback";
    const firstLook = looking ? talk.text : review.observations;
    const feedback = responding ? talk.text : review.feedback;
    const stuck = !review.observations && !looking;
    return (
      <Screen>
        {header}
        <div className="mt-3 space-y-5 pb-6">
          <div>
            <Kicker>{review.task}</Kicker>
            <h1 data-screen-heading tabIndex={-1} className="sr-only">
              Photo check: {review.task}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the student's own camera */}
            <img
              src={review.image}
              alt="Your workshop photo"
              className="mt-1.5 max-h-[46dvh] w-full rounded-2xl border border-ink/12 bg-card object-contain"
            />
            {review.note ? <p className="mt-2 text-[0.97rem] text-ink/65">Your note: “{review.note}”</p> : null}
          </div>

          {firstLook || looking ? <ForemanSays text={firstLook} streaming={looking} /> : null}

          {review.reasoning ? (
            <div className="rounded-2xl border border-ink/12 bg-card p-4">
              <Kicker tone="ink">Your explanation</Kicker>
              <p className="text-ink/85">“{review.reasoning}”</p>
            </div>
          ) : null}

          {feedback || responding ? (
            <ForemanSays text={feedback} streaming={responding} label="Foreman's feedback" />
          ) : null}

          {error ? <Notice>{error}</Notice> : null}
          {review.status === "complete" ? (
            <p className="text-sm text-ink/55">
              Checked {shortDate(review.createdAt)}. The foreman can only judge what a photo shows. Your teacher has the
              final say on your practical work.
            </p>
          ) : null}
        </div>

        <ActionBar>
          {review.status === "complete" ? (
            <>
              {reviewId ? (
                <Link href={jobId ? `/photo?job=${jobId}` : "/photo"} className={buttonClass("secondary")}>
                  Another photo
                </Link>
              ) : (
                <Button variant="secondary" onClick={startOver}>
                  Another photo
                </Button>
              )}
              <Link href={review.jobId ? `/jobs/${review.jobId}` : backHref} className={buttonClass("primary")}>
                Done
              </Link>
            </>
          ) : stuck && review.id ? (
            <Button onClick={() => void run("look", `/api/photo/${review.id}/explain`, {})}>Try again</Button>
          ) : stuck ? (
            <Button
              onClick={() => {
                setReview(null);
                setError(null);
              }}
            >
              Start again
            </Button>
          ) : (
            <Composer
              disabled={looking || responding || !review.id}
              placeholder="Say or type how you went about it"
              sendLabel="Send your explanation"
              minLength={10}
              maxLength={900}
              onSubmit={(reasoning) =>
                void run("feedback", `/api/photo/${review.id}/explain`, { reasoning })
              }
            />
          )}
        </ActionBar>
      </Screen>
    );
  }

  // ----- Start a new photo check -----
  const ready = Boolean(photo) && task.trim().length > 0;
  return (
    <Screen>
      {header}
      <div className="mt-3 pb-6">
        <h1
          data-screen-heading
          tabIndex={-1}
          className="font-display text-[2.2rem] font-bold uppercase leading-[0.95] tracking-wide"
        >
          Show the foreman your work
        </h1>
        <p className="mt-2 text-ink/75">
          Send a photo of your practical work from the workshop. The foreman takes a look, asks how you went about it,
          then gives you feedback.
        </p>

        {!aiEnabled ? (
          <div className="mt-4">
            <Notice tone="info">Photo checks need the AI foreman, and he&apos;s offline right now.</Notice>
          </div>
        ) : null}

        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL from the student's own camera
          <img
            src={photo.preview}
            alt="The photo you chose"
            className="mt-5 max-h-[40dvh] w-full rounded-2xl border border-ink/12 bg-card object-contain"
          />
        ) : null}

        <div className="mt-5">
          <Kicker tone="ink">What is it?</Kicker>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {TASKS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={task === name}
                onClick={() => setTask(name)}
                className={`min-h-12 rounded-full border-2 px-4 text-[1rem] transition-transform duration-100 active:scale-95 ${
                  task === name ? "border-accent bg-accent text-white" : "border-ink/20 bg-card"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={taskId}>
            What the work is
          </label>
          <input
            id={taskId}
            value={task}
            onChange={(event) => setTask(event.target.value)}
            maxLength={80}
            placeholder="Or type what it is"
            className="mt-2.5 h-14 w-full rounded-2xl border-2 border-ink/20 bg-card px-4 text-[1.06rem] placeholder:text-ink/40 focus:border-accent focus:outline-none"
          />
          <label className="sr-only" htmlFor={noteId}>
            Anything the foreman should know
          </label>
          <input
            id={noteId}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            placeholder="Anything he should know? (optional)"
            className="mt-2.5 h-14 w-full rounded-2xl border-2 border-ink/20 bg-card px-4 text-[1.06rem] placeholder:text-ink/40 focus:border-accent focus:outline-none"
          />
        </div>

        {error ? (
          <div className="mt-4">
            <Notice>{error}</Notice>
          </div>
        ) : null}

        {past && past.length > 0 ? (
          <section className="mt-8">
            <Kicker tone="ink">Earlier photo checks</Kicker>
            <ul className="mt-2 space-y-2.5">
              {past.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/photo/${item.id}`}
                    className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border-2 border-ink/15 bg-card p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a small stored preview */}
                    <img src={item.image} alt="" className="size-14 rounded-xl object-cover" />
                    <span className="flex-1 leading-snug">
                      <span className="block font-semibold">{item.task}</span>
                      <span className="text-[0.93rem] text-ink/60">
                        {item.status === "complete" ? shortDate(item.createdAt) : "Waiting for your explanation"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={choose} />
      <input ref={libraryInput} type="file" accept="image/*" className="hidden" onChange={choose} />

      <ActionBar>
        {photo ? (
          <>
            <Button variant="secondary" disabled={preparing} onClick={() => libraryInput.current?.click()}>
              Change
            </Button>
            <Button disabled={!ready || !aiEnabled} onClick={send}>
              Send to foreman
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" disabled={preparing} onClick={() => libraryInput.current?.click()}>
              Choose photo
            </Button>
            <Button disabled={preparing} onClick={() => cameraInput.current?.click()}>
              <CameraIcon />
              {preparing ? "One sec…" : "Take photo"}
            </Button>
          </>
        )}
      </ActionBar>
    </Screen>
  );
}
