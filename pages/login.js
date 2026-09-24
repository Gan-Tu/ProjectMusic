import Link from "next/link";
import { useRouter } from "next/router";
import AppContainer from "../components/AppContainer";
import LoginPanel from "../components/content/LoginPanel";
import { loginHref } from "../lib/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const next = typeof router.query.next === "string" ? router.query.next : "";
  return (
    <AppContainer
      title="Login"
      curMenu="Login"
      description="Log in to your Projct Music account: your purchases, credits and profile."
    >
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-100 px-5 py-12 sm:py-20">
        <h1 className="mb-8 text-center text-xs font-bold uppercase tracking-[0.25em]">
          Welcome back to Projct
        </h1>
        <div className="w-full max-w-md">
          <LoginPanel />
        </div>
        <p className="mt-7 text-sm text-neutral-600">
          New here?{" "}
          <Link
            href={loginHref(next, "/signup")}
            className="font-semibold text-pmred-dark hover:underline"
          >
            Join the community
          </Link>
        </p>
      </div>
    </AppContainer>
  );
}
