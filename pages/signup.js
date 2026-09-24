import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AppContainer from "../components/AppContainer";
import LoginPanel from "../components/content/LoginPanel";
import { TextField, Toggle } from "../components/ui/Form";
import Button from "../components/ui/Button";
import { safeNext, useSessionContext } from "../lib/SessionProvider";
import { useStore } from "../lib/store";
import { formatNumber } from "../lib/format";

const networks = [
  "Vimeo",
  "Facebook",
  "Pinterest",
  "SoundCloud",
  "YouTube",
  "Instagram",
  "Twitter",
  "Tumblr",
  "Twitch"
];

export default function SignupPage() {
  const [password, setPassword] = useState("");
  const [connections, setConnections] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session] = useSessionContext();
  const { actions } = useStore();
  const router = useRouter();
  const next = safeNext(router.query.next);
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  async function signup(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const fields = {
      name: String(data.get("name") || "").trim(),
      username: String(data.get("username") || "")
        .trim()
        .toLowerCase(),
      email: String(data.get("email") || "").trim(),
      location: String(data.get("location") || "").trim(),
      password
    };
    if (!fields.name) return setError("Please enter your full name.");
    if (!/^[a-z0-9._-]{3,30}$/.test(fields.username))
      return setError("Pick a username of 3 to 30 letters, numbers, dots, dashes or underscores.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (!data.get("terms")) return setError("Please accept the terms to continue.");
    setBusy(true);
    setError("");
    const result = await session.signup(fields);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    // The social switches are a local preference only; nothing is connected.
    actions.subscribe("socialConnections", connections);
    const bonus = result.user.credits;
    toast.success(
      `You’re in. Welcome to Projct, ${result.user.name.split(" ")[0]}!${
        bonus ? ` ${formatNumber(bonus)} credits are waiting in your account.` : ""
      }`
    );
    try {
      await router.push(next);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppContainer
      curMenu="Sign up"
      description="Join the Projct Music community: create your account and get welcome credits."
    >
      <div className="border-b border-neutral-200 px-6 py-8 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pmred">
          Music brings us together
        </p>
        <h1 className="mt-3 text-3xl font-extrabold uppercase">Make yourself at home.</h1>
      </div>
      <div className="mx-auto grid w-full max-w-7xl items-start lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={signup} className="px-6 py-10 sm:px-10 sm:py-14">
          <p className="mb-8 text-sm leading-6 text-neutral-500">
            Create your Projct Music account to buy music, merch and tickets, collect points and
            join the conversation. New members get welcome credits. Payments on this site are
            simulated: no real money is ever charged.
          </p>
          <fieldset>
            <legend className="mb-6 text-xs font-bold uppercase tracking-widest">
              Personal information
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="signup-name"
                name="name"
                label="Full name *"
                autoComplete="name"
                required
                maxLength={80}
                placeholder="Full name"
              />
              <div>
                <TextField
                  id="signup-username"
                  name="username"
                  label="Username *"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9._\-]{3,30}"
                  aria-describedby="username-hint"
                  placeholder="e.g. night.owl"
                />
                <p id="username-hint" className="mt-2 text-xs text-neutral-500">
                  Shown on your comments. 3–30 letters, numbers, dots, dashes or underscores.
                </p>
              </div>
              <TextField
                id="signup-email"
                name="email"
                label="Email *"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
              <TextField
                id="signup-location"
                name="location"
                label="Location"
                autoComplete="address-level2"
                maxLength={80}
                placeholder="City, country"
              />
              <div className="sm:col-span-2">
                <TextField
                  id="signup-password"
                  name="password"
                  label="Password *"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-describedby="password-hint"
                  placeholder="At least 8 characters"
                />
                <div className="mt-3 flex max-w-xs gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={`h-1 flex-1 rounded-full ${strength >= level ? "bg-pmred" : "bg-neutral-200"}`}
                    />
                  ))}
                </div>
                <p id="password-hint" className="mt-2 text-xs text-neutral-500">
                  {password
                    ? ["Add more characters", "Getting started", "Fair", "Good", "Strong"][strength]
                    : "Use 8+ characters. Mix letters, numbers and symbols."}
                </p>
              </div>
            </div>
          </fieldset>
          <fieldset className="mt-10 border-t border-neutral-200 pt-8">
            <legend className="pr-4 text-xs font-bold uppercase tracking-widest">
              Social connections
            </legend>
            <p className="mb-6 text-xs leading-6 text-neutral-500">
              Demo switches only. No external accounts are connected.
            </p>
            <div className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
              {networks.map((network) => (
                <div
                  key={network}
                  className="flex items-center justify-between gap-4 border-b border-neutral-100 py-4"
                >
                  <span className="text-xs text-neutral-600">{network}</span>
                  <Toggle
                    checked={!!connections[network]}
                    onChange={(checked) =>
                      setConnections((current) => ({ ...current, [network]: checked }))
                    }
                    label={`Connect ${network} in demo`}
                  />
                </div>
              ))}
            </div>
          </fieldset>
          <div className="mt-8 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-neutral-500">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-pmred"
              />
              <span>
                I accept the terms: this is a demo shop. Payments are simulated (no real money is
                charged) and the social switches don&apos;t connect any external account.
              </span>
            </label>
            {error && (
              <p className="text-sm text-pmred" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6">
              <Button href="/" variant="muted" size="md">
                Cancel
              </Button>
              <Button type="submit" size="md" className="cursor-pointer" disabled={busy}>
                {busy ? "Creating account…" : "Sign up"}
              </Button>
            </div>
          </div>
        </form>
        <aside className="lg:sticky lg:top-20">
          <LoginPanel />
        </aside>
      </div>
    </AppContainer>
  );
}
