"use client";

import { useState, type FormEvent } from "react";
import { ActionBar, Button, Notice, Screen, Wordmark } from "@/components/ui";
import { api, hardNavigate, messageOf } from "@/lib/client/api";

const FIELD =
  "h-14 w-full rounded-2xl border-2 border-ink/20 bg-card px-4 text-[1.06rem] placeholder:text-ink/40 focus:border-accent focus:outline-none";
const LABEL = "mb-1.5 block font-display text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-ink/65";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const registering = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api(registering ? "/api/auth/register" : "/api/auth/login", {
        body: registering ? { name, email, password, classCode } : { email, password },
      });
      hardNavigate("/");
    } catch (failure) {
      setError(messageOf(failure));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <div className="pt-12">
        <Wordmark size="lg" />
        <p className="mt-4 max-w-[19rem] text-[1.15rem] leading-snug text-ink/75">
          Run a house build from set-out to handover. Make the calls. Learn why.
        </p>
      </div>

      <form onSubmit={submit} className="mt-9 flex flex-1 flex-col" noValidate>
        <h1 data-screen-heading className="font-display text-[1.9rem] font-bold uppercase leading-none tracking-wide">
          {registering ? "Create your account" : "Sign in"}
        </h1>

        <div className="mt-5 space-y-4 pb-6">
          {registering ? (
            <div>
              <label className={LABEL} htmlFor="name">
                Your name
              </label>
              <input
                id="name"
                className={FIELD}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={60}
                required
              />
            </div>
          ) : null}
          <div>
            <label className={LABEL} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={FIELD}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={FIELD}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            {registering ? <p className="mt-1.5 text-sm text-ink/55">At least 8 characters.</p> : null}
          </div>
          {registering ? (
            <div>
              <label className={LABEL} htmlFor="classCode">
                Class code <span className="normal-case tracking-normal text-ink/45">(if your teacher gave you one)</span>
              </label>
              <input
                id="classCode"
                className={FIELD}
                value={classCode}
                onChange={(event) => setClassCode(event.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                maxLength={60}
              />
            </div>
          ) : null}
          {error ? <Notice>{error}</Notice> : null}
        </div>

        <ActionBar>
          <Button
            variant="quiet"
            onClick={() => {
              setMode(registering ? "signin" : "register");
              setError(null);
            }}
          >
            {registering ? "I have an account" : "New here?"}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "One sec…" : registering ? "Create account" : "Sign in"}
          </Button>
        </ActionBar>
      </form>
    </Screen>
  );
}
