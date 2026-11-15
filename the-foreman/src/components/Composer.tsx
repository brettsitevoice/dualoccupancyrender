"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { MicIcon, SendIcon, StopIcon } from "./icons";

/**
 * Where the student answers in their own words. One big round button on the
 * right: tap it to talk, tap again to stop, then tap to send. Typing works
 * too, and is the fallback where the browser has no speech recognition.
 */
export function Composer({
  onSubmit,
  disabled = false,
  placeholder,
  minLength = 3,
  maxLength = 700,
  sendLabel = "Send answer",
}: {
  onSubmit: (text: string, mode: "voice" | "text") => void;
  disabled?: boolean;
  /** Shown in the box when voice input is available. */
  placeholder: string;
  minLength?: number;
  maxLength?: number;
  sendLabel?: string;
}) {
  const [text, setText] = useState("");
  const [spoke, setSpoke] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  // Earlier screens stay in the page in the background, so ids must be unique.
  const boxId = useId();

  const onHeard = useCallback(
    (heard: string) => {
      setText((current) => `${current}${current ? " " : ""}${heard}`.slice(0, maxLength));
      setSpoke(true);
    },
    [maxLength],
  );
  const speech = useSpeech(onHeard);

  // Grow the box with its content, up to a few lines.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
  }, [text]);

  const hasText = text.trim().length > 0;
  const canSend = text.trim().length >= minLength && !disabled;

  const send = () => {
    if (!canSend) return;
    speech.stop();
    onSubmit(text.trim(), spoke ? "voice" : "text");
    setText("");
    setSpoke(false);
  };

  const mode: "stop" | "send" | "mic" = speech.listening ? "stop" : hasText || !speech.supported ? "send" : "mic";
  const press = () => {
    if (mode === "stop") speech.stop();
    else if (mode === "mic") speech.start();
    else send();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {speech.listening ? (
        <p className="text-right text-[0.95rem] text-accent-deep" role="status">
          Listening… {speech.interim}
        </p>
      ) : speech.error ? (
        <p className="text-right text-[0.95rem] text-bad" role="alert">
          {speech.error}
        </p>
      ) : null}
      <div className="flex items-end gap-3">
        <label className="sr-only" htmlFor={boxId}>
          {placeholder}
        </label>
        <textarea
          id={boxId}
          ref={box}
          rows={1}
          value={text}
          maxLength={maxLength}
          disabled={disabled}
          enterKeyHint="send"
          placeholder={speech.supported ? placeholder : placeholder.replace(/^Say or type/i, "Type")}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
          className="min-h-16 min-w-0 flex-1 resize-none rounded-2xl border-2 border-ink/20 bg-card px-4 py-[1.1rem] text-[1.06rem] leading-snug placeholder:text-ink/45 focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={press}
          disabled={disabled || (mode === "send" && !canSend)}
          aria-label={mode === "stop" ? "Stop listening" : mode === "mic" ? "Answer by voice" : sendLabel}
          className={`flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[0_3px_0_var(--color-accent-deep)] transition-transform duration-100 active:scale-95 active:shadow-none disabled:pointer-events-none disabled:opacity-40 ${speech.listening ? "animate-ring" : ""}`}
        >
          {mode === "stop" ? (
            <StopIcon width={30} height={30} />
          ) : mode === "mic" ? (
            <MicIcon width={30} height={30} />
          ) : (
            <SendIcon width={30} height={30} />
          )}
        </button>
      </div>
    </div>
  );
}
