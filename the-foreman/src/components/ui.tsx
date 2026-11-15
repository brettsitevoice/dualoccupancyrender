import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { HardHat } from "./icons";

// Shared building blocks. Layout rule for the whole app: anything the student
// taps sits on the right-hand side and towards the bottom of the screen,
// inside easy reach of a right thumb. Reading goes on the left and top.

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold uppercase tracking-wide " +
  "transition-transform duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 select-none";

const BUTTON_VARIANT = {
  // White on the orange accent passes contrast for large bold text only, so
  // primary button labels stay at 22px semibold or bigger.
  primary: "min-h-16 px-7 text-[1.4rem] leading-none bg-accent text-white shadow-[0_3px_0_var(--color-accent-deep)] active:shadow-none",
  secondary: "min-h-16 px-5 text-[1.25rem] leading-none bg-card text-ink border-2 border-ink/20",
  quiet: "min-h-12 px-3 text-[1.1rem] leading-none text-ink/80 underline decoration-ink/30 underline-offset-4",
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${className}`} {...props} />;
}

export function buttonClass(variant: keyof typeof BUTTON_VARIANT = "primary", extra = ""): string {
  return `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${extra}`;
}

/** Page frame: padded column that fills the screen. */
export function Screen({
  children,
  className = "",
  ref,
}: {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}) {
  return (
    <main ref={ref} className={`flex flex-1 flex-col px-5 pt-3 ${className}`}>
      {children}
    </main>
  );
}

/**
 * The bar at the bottom of the screen that holds the main actions, pushed to
 * the right. It stays in view while the page scrolls.
 */
export function ActionBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`sticky bottom-0 z-10 -mx-5 mt-auto border-t border-ink/10 bg-paper/95 px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur-sm print:hidden ${className}`}
    >
      <div className="flex items-end justify-end gap-3">{children}</div>
    </div>
  );
}

/** Small uppercase label, like the title block on a drawing. */
export function Kicker({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "ink" }) {
  return (
    <p
      className={`font-display text-[0.95rem] font-semibold uppercase tracking-[0.16em] ${tone === "accent" ? "text-accent-deep" : "text-ink/60"}`}
    >
      {children}
    </p>
  );
}

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div className="flex items-center gap-2.5">
      <HardHat size={size === "lg" ? 52 : 30} />
      <span
        className={`font-display font-bold uppercase leading-none tracking-wide ${size === "lg" ? "text-[2.6rem]" : "text-[1.35rem]"}`}
      >
        The Foreman
      </span>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-2" role="status" aria-label="The foreman is thinking">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-2 animate-dot rounded-full bg-ink/60"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/** Something the foreman says. Shows dots while he's thinking and a caret while the words stream in. */
export function ForemanSays({
  text,
  streaming = false,
  label = "Foreman",
  note,
}: {
  text: string;
  streaming?: boolean;
  label?: string;
  note?: string;
}) {
  const parts = text.split(/\n{2,}/).filter((part) => part.trim());
  return (
    <section className="animate-rise">
      <div className="mb-1.5 flex items-center gap-2">
        <HardHat size={22} />
        <Kicker tone="ink">{label}</Kicker>
      </div>
      <div aria-live="polite" className="space-y-3 text-[1.06rem] leading-relaxed">
        {parts.length === 0 && streaming ? (
          <ThinkingDots />
        ) : (
          parts.map((part, index) => (
            <p key={index} className="whitespace-pre-line">
              {part}
              {streaming && index === parts.length - 1 ? (
                <span className="ml-0.5 inline-block h-[1.05em] w-[3px] translate-y-[0.18em] animate-caret bg-accent" aria-hidden="true" />
              ) : null}
            </p>
          ))
        )}
      </div>
      {note && !streaming ? <p className="mt-2 text-sm text-ink/55">{note}</p> : null}
    </section>
  );
}

export function Notice({ children, tone = "bad" }: { children: ReactNode; tone?: "bad" | "info" }) {
  return (
    <p
      role={tone === "bad" ? "alert" : "status"}
      className={`rounded-xl border-l-4 bg-card px-3.5 py-2.5 text-[0.97rem] ${tone === "bad" ? "border-bad text-bad" : "border-accent text-ink/80"}`}
    >
      {children}
    </p>
  );
}

export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <Screen className="items-center justify-center pb-10">
      <div className="flex flex-col items-center gap-4" role="status">
        <HardHat size={56} />
        <p className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-ink/60">{label}</p>
      </div>
    </Screen>
  );
}
