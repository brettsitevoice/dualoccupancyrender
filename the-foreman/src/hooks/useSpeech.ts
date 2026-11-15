"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Voice input using the browser's own speech recognition (Web Speech API).
// It's available in Chrome, Edge and Safari; where it isn't, the app falls
// back to typing.

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "The microphone is blocked. Type your answer instead.",
  "service-not-allowed": "The microphone is blocked. Type your answer instead.",
  "audio-capture": "Couldn't find a microphone. Type your answer instead.",
  network: "Voice needs an internet connection. Type your answer instead.",
  "no-speech": "Didn't hear anything. Tap the mic and try again.",
};

const subscribe = () => () => {};

export function useSpeech(onHeard: (text: string) => void) {
  // False on the server and on first paint, so the page hydrates cleanly.
  const supported = useSyncExternalStore(
    subscribe,
    () => recognitionConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const heard = useRef(onHeard);

  useEffect(() => {
    heard.current = onHeard;
  }, [onHeard]);

  useEffect(() => () => active.current?.abort(), []);

  const stop = useCallback(() => {
    active.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    active.current?.abort();

    const recognition = new Constructor();
    recognition.lang = "en-AU";
    recognition.interimResults = true;
    // One utterance at a time: it stops by itself when the student pauses.
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      setInterim("");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText.trim());
      if (finalText.trim()) heard.current(finalText.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(ERRORS[event.error] ?? "Voice input didn't work. Type your answer instead.");
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (active.current === recognition) active.current = null;
    };

    active.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Voice input didn't work. Type your answer instead.");
    }
  }, []);

  return { supported, listening, interim, error, start, stop };
}
