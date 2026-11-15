import type { GameView, PhotoReviewView, Quality } from "@/lib/game/types";

// Events sent from the server to the browser while the foreman is talking.
// Each event is one line of JSON (newline-delimited JSON).

export type StreamEvent =
  /** More of the foreman's words to add to what's on screen. */
  | { t: "delta"; text: string }
  /** Throw away the words received so far (the reply is starting again). */
  | { t: "reset" }
  /** The foreman's verdict on an answer given in the student's own words. */
  | { t: "verdict"; verdict: Quality | "unclear" }
  /** The game has moved on: here is the new state to show. */
  | { t: "view"; view: GameView }
  /** A workshop photo review was created or updated. */
  | { t: "photo"; review: PhotoReviewView }
  /** Finished. `ai` is false when the built-in notes were used instead of the AI foreman. */
  | { t: "done"; ai: boolean }
  | { t: "error"; message: string };
