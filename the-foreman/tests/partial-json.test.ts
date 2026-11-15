import { describe, expect, it } from "vitest";
import { readPartialString } from "../src/lib/ai/partial-json";

describe("reading a string field from JSON that is still streaming", () => {
  const full = JSON.stringify({
    verdict: "partial",
    closest: "b",
    feedback: 'Close. He said "she\'ll be right" — it won\'t.\nBook the certifier: 48 hours’ notice. \\ done 😀',
  });

  it("returns null before the field starts", () => {
    expect(readPartialString("", "feedback")).toBeNull();
    expect(readPartialString('{"verdict":"go', "feedback")).toBeNull();
    expect(readPartialString('{"verdict":"good","closest":"a","feedback"', "feedback")).toBeNull();
    expect(readPartialString('{"verdict":"good","closest":"a","feedback":', "feedback")).toBeNull();
  });

  it("matches the final value at every point of the stream", () => {
    const expected = (JSON.parse(full) as { feedback: string }).feedback;
    let last = "";
    for (let cut = 1; cut <= full.length; cut++) {
      const partial = readPartialString(full.slice(0, cut), "feedback");
      if (!partial) continue;
      // What has arrived so far is always a prefix of the finished text, and never shrinks.
      expect(expected.startsWith(partial.value), `cut ${cut}: ${partial.value}`).toBe(true);
      expect(partial.value.length).toBeGreaterThanOrEqual(last.length);
      last = partial.value;
      expect(partial.done).toBe(cut >= full.length - 1);
    }
    expect(last).toBe(expected);
  });

  it("reads the short fields that come first", () => {
    expect(readPartialString(full, "verdict")).toEqual({ value: "partial", done: true });
    expect(readPartialString(full, "closest")).toEqual({ value: "b", done: true });
    expect(readPartialString('{"verdict":"par', "verdict")).toEqual({ value: "par", done: false });
  });

  it("is not fooled by the field name appearing inside another value", () => {
    const tricky = JSON.stringify({ verdict: 'say "feedback": "x"', feedback: "real" });
    expect(readPartialString(tricky, "feedback")).toEqual({ value: "real", done: true });
  });

  it("handles unicode escapes split across chunks", () => {
    const escaped = '{"feedback":"caf\\u00e9 \\ud83d\\ude00 ok"}';
    for (let cut = 14; cut <= escaped.length; cut++) {
      const partial = readPartialString(escaped.slice(0, cut), "feedback")!;
      expect("café 😀 ok".startsWith(partial.value), `cut ${cut}`).toBe(true);
    }
    expect(readPartialString(escaped, "feedback")).toEqual({ value: "café 😀 ok", done: true });
  });
});
