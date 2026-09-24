import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AppContainer from "../components/AppContainer";
import LoginPanel from "../components/content/LoginPanel";
import { TextField, Toggle } from "../components/ui/Form";
import Button from "../components/ui/Button";
import { useSessionContext } from "../lib/SessionProvider";
import { useStore } from "../lib/store";

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
  const [, dispatch] = useSessionContext();
  const { actions } = useStore();
  const router = useRouter();
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  async function signup(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get("name").trim()) return setError("Please enter your full name.");
    if (password.length < 8) return setError("Use at least 8 characters for your demo password.");
    const dob = data.get("dob");
    if (dob && (dob > new Date().toISOString().slice(0, 10) || Number(dob.slice(0, 4)) < 1900))
      return setError("Please enter a valid date of birth.");
    if (!data.get("terms")) return setError("Please accept the demo terms to continue.");
    setBusy(true);
    // Keep the single demo identity; never store a password or personal form details.
    actions.subscribe("socialConnections", connections);
    dispatch({ type: "set_user", user: {} });
    toast.success("You’re in. Welcome to Projct, Nick!");
    try {
      await router.push("/profile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppContainer
      curMenu="Sign up"
      description="Join the Projct Music community. Explore the single-user demo as Nick Breton."
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
            Explore as Nick Breton in this single-user demo. Use made-up information; no account is
            created and your password is never saved.
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
                maxLength={100}
                placeholder="Full name"
              />
              <TextField
                id="signup-address"
                name="address"
                label="Address"
                autoComplete="street-address"
                maxLength={250}
                placeholder="Street, city, country"
              />
              <TextField
                id="signup-phone"
                name="phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="Phone number"
              />
              <TextField
                id="signup-dob"
                name="dob"
                label="Date of birth"
                type="date"
                autoComplete="bday"
                min="1900-01-01"
              />
              <TextField
                id="signup-email"
                name="email"
                label="Email *"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
                placeholder="you@example.com"
              />
              <label
                htmlFor="signup-gender"
                className="flex flex-col gap-2 text-xs font-medium text-neutral-800"
              >
                Gender
                <select
                  id="signup-gender"
                  name="gender"
                  autoComplete="sex"
                  className="h-10 w-full cursor-pointer rounded-full border border-neutral-200 bg-white px-4 text-sm font-normal focus:border-pmred focus:outline-none focus:ring-2 focus:ring-pmred/15"
                >
                  <option value="">Prefer not to say</option>
                  <option>Woman</option>
                  <option>Man</option>
                  <option>Non-binary</option>
                  <option>Self-described</option>
                </select>
              </label>
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
                I accept the demo terms: this is a local preview, with no real account, purchase or
                social connection.
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
                {busy ? "Opening…" : "Sign up"}
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
