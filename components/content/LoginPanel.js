import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useSessionContext } from "../../lib/SessionProvider";
import Button from "../ui/Button";

export default function LoginPanel() {
  const [, dispatch] = useSessionContext();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function login(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get("username").trim() || !data.get("password").trim())
      return toast.error("Enter a username and password to continue.");
    setBusy(true);
    dispatch({ type: "set_user", user: {} });
    toast.success("Welcome back, Nick.");
    try {
      await router.push("/profile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="bg-pmred px-7 py-10 text-white sm:px-10 sm:py-12">
      <p className="mb-6 text-2xs font-bold uppercase tracking-[0.2em] text-white">
        Already part of the crew?
      </p>
      <h2 className="text-3xl font-extrabold uppercase tracking-wide">Login</h2>
      <p className="mt-4 text-sm font-light leading-7 text-white">
        Your music. Your people.
        <br />
        Right where you left them.
      </p>
      <form onSubmit={login} className="mt-8 space-y-5">
        <label htmlFor="login-username" className="block text-xs">
          <span>Username</span>
          <input
            id="login-username"
            name="username"
            required
            autoComplete="username"
            maxLength={100}
            placeholder="Your username"
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
            className="mt-2 w-full border-b border-white/50 bg-transparent px-0 py-3 text-sm placeholder:text-white/60 focus:border-white focus:outline-none"
          />
        </label>
        <p className="text-xs leading-6 text-white">
          Demo access: any username and password opens Nick Breton&apos;s profile. Use made-up
          details.
        </p>
        <Button type="submit" variant="light" size="md" disabled={busy} className="cursor-pointer">
          {busy ? "Opening…" : "Login"}
        </Button>
      </form>
    </section>
  );
}
