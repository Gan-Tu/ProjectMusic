import Link from "next/link";
import AppContainer from "../components/AppContainer";
import LoginPanel from "../components/content/LoginPanel";

export default function LoginPage() {
  return (
    <AppContainer
      curMenu="Login"
      description="Welcome back to Projct Music. Open Nick Breton’s demo profile."
    >
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-100 px-5 py-12 sm:py-20">
        <h1 className="mb-8 text-center text-xs font-bold uppercase tracking-[0.25em]">
          Welcome back to Projct
        </h1>
        <div className="w-full max-w-md">
          <LoginPanel />
        </div>
        <p className="mt-7 text-sm text-neutral-500">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-pmred hover:underline">
            Join the community
          </Link>
        </p>
      </div>
    </AppContainer>
  );
}
