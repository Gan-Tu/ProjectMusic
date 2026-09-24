import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { safeNext, useSessionContext } from "../../lib/SessionProvider";
import Button from "../ui/Button";

// Member login (username or email + password). After logging in it continues to
// `?next=` (a path on this site) or the profile.
export default function LoginPanel() {
  const [session] = useSessionContext();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = safeNext(router.query.next);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("login") || "").trim();
    const password = String(data.get("password") || "");
    if (!name || !password) return setError("Enter your username or email and your password.");
    setBusy(true);
    setError("");
    const result = await session.login(name, password);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    toast.success(`Welcome back, ${result.user.name.split(" ")[0]}!`);
    try {
      await router.push(next);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const result = await session.logout();
    if (result.ok) toast.success("You have been logged out.");
    else toast.error(result.error);
  }

  return (
    <section className="bg-pmred px-7 py-10 text-white sm:px-10 sm:py-12">
      <p className="mb-6 text-2xs font-bold uppercase tracking-[0.2em] text-white">
        Already part of the crew?
      </p>
      <h2 className="text-3xl font-extrabold uppercase tracking-wide">Login</h2>
      {session.user ? (
        <>
          <p className="mt-4 text-sm font-light leading-7 text-white">
            You&apos;re logged in as <strong className="font-bold">{session.user.name}</strong> (
            {session.user.username}).
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href={next} variant="light" size="md">
              Continue
            </Button>
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer text-xs font-bold uppercase tracking-wider underline underline-offset-4"
            >
              Log out
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm font-light leading-7 text-white">
            Your music. Your people.
            <br />
            Right where you left them.
          </p>
          <form onSubmit={login} className="mt-8 space-y-5" noValidate>
            <label htmlFor="login-username" className="block text-xs">
              <span>Username or email</span>
              <input
                id="login-username"
                name="login"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                placeholder="Your username or email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className="mt-2 w-full border-b border-white/50 bg-transparent px-0 py-3 text-sm placeholder:text-white/60 focus:border-white focus:outline-none"
              />
            </label>
            <label htmlFor="login-password" className="block text-xs">
              <span>Password</span>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
                placeholder="Your password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className="mt-2 w-full border-b border-white/50 bg-transparent px-0 py-3 text-sm placeholder:text-white/60 focus:border-white focus:outline-none"
              />
            </label>
            {error && (
              <p
                id="login-error"
                role="alert"
                className="bg-white px-4 py-2 text-xs font-semibold text-pmred-dark"
              >
                {error}
              </p>
            )}
            <p className="text-xs leading-6 text-white">
              Demo account: <strong className="font-bold">demo</strong> /{" "}
              <strong className="font-bold">demo1234</strong>
            </p>
            <Button
              type="submit"
              variant="light"
              size="md"
              disabled={busy}
              className="cursor-pointer"
            >
              {busy ? "Logging in…" : "Login"}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
