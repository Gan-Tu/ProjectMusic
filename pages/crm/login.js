import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Logo from "../../components/Logo";
import Button from "../../components/ui/Button";
import { crmFetch } from "../../components/crm/api";
import { getSessionAdmin } from "../../lib/server/auth";
import { safeNext } from "../../lib/server/crm/guard";

export async function getServerSideProps({ req, res, query }) {
  const next = safeNext(query.next);
  if (await getSessionAdmin(req)) return { redirect: { destination: next, permanent: false } };
  res.setHeader("Cache-Control", "private, no-store");
  return { props: { next } };
}

const INPUT =
  "mt-2 w-full border-b border-white/50 bg-transparent px-0 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none";

export default function CrmLogin({ next }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await crmFetch("/api/crm/login", {
        method: "POST",
        body: { username: form.get("username"), password: form.get("password") }
      });
      toast.success("Welcome back, Nick.");
      await router.replace(next);
    } catch (loginError) {
      setError(loginError.message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-4">
      <Head>
        <title>CRM login · Projct Music</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="w-full max-w-md shadow-2xl motion-safe:animate-slide-up">
        <div className="flex items-center justify-between bg-white px-7 py-5 sm:px-10">
          <Logo href="/" className="text-sm" />
          <span className="bg-black px-1.5 py-0.5 text-2xs font-bold tracking-widest text-white">
            CRM
          </span>
        </div>
        <section className="bg-pmred px-7 py-10 text-white sm:px-10 sm:py-12">
          <p className="mb-6 text-2xs font-bold uppercase tracking-[0.2em]">Backstage access</p>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">Admin login</h1>
          <p className="mt-4 text-sm font-light leading-7">
            Artists, music, shows and the shop.
            <br />
            Everything the site shows, in one place.
          </p>
          <form onSubmit={login} className="mt-8 space-y-5">
            <label htmlFor="crm-username" className="block text-xs">
              <span>Email</span>
              <input
                id="crm-username"
                name="username"
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                maxLength={100}
                placeholder="Your admin email"
                className={INPUT}
              />
            </label>
            <label htmlFor="crm-password" className="block text-xs">
              <span>Password</span>
              <input
                id="crm-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
                placeholder="Your password"
                className={INPUT}
              />
            </label>
            {error && (
              <p role="alert" className="bg-black/20 px-4 py-3 text-xs font-medium">
                {error}
              </p>
            )}
            <Button type="submit" variant="light" size="md" disabled={busy}>
              {busy ? "Signing in…" : "Login"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
