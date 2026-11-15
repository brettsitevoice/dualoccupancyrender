// Helpers for reading a JSON object while it is still streaming in, so the
// foreman's feedback can appear on screen word by word.

const ESCAPES: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

/**
 * Read the value of a top-level string field from JSON text that may be
 * incomplete. Returns what has arrived so far, or null if the field hasn't
 * started yet. `done` is true once the closing quote has arrived.
 */
export function readPartialString(json: string, key: string): { value: string; done: boolean } | null {
  const marker = `"${key}"`;
  const keyAt = json.indexOf(marker);
  if (keyAt < 0) return null;
  let i = keyAt + marker.length;
  while (i < json.length && /\s/.test(json[i])) i++;
  if (json[i] !== ":") return null;
  i++;
  while (i < json.length && /\s/.test(json[i])) i++;
  if (json[i] !== '"') return null;
  i++;

  let value = "";
  for (; i < json.length; i++) {
    const char = json[i];
    if (char === '"') return { value, done: true };
    if (char !== "\\") {
      value += char;
      continue;
    }
    const next = json[i + 1];
    if (next === undefined) break; // escape sequence not complete yet
    if (next === "u") {
      const hex = json.slice(i + 2, i + 6);
      if (hex.length < 4) break;
      const code = Number.parseInt(hex, 16);
      // Hold back a lone high surrogate until its partner arrives.
      if (code >= 0xd800 && code <= 0xdbff && json.length < i + 12) break;
      value += String.fromCharCode(code);
      i += 5;
      continue;
    }
    value += ESCAPES[next] ?? next;
    i += 1;
  }
  return { value, done: false };
}
