import type { Quality } from "@/lib/game/types";

// Small formatting helpers shared by the screens and the evidence export.

export function money(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-AU")}`;
}

export function days(count: number): string {
  return `${count} ${Math.abs(count) === 1 ? "day" : "days"}`;
}

export const VERDICT_LABEL: Record<Quality, string> = {
  good: "Good call",
  partial: "Partly right",
  poor: "Wrong call",
};

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
