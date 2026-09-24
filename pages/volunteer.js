import dynamic from "next/dynamic";
import Image from "next/image";
import AppContainer from "../components/AppContainer";
const CommunityForm = dynamic(() => import("../components/content/CommunityForm"), {
  ssr: false,
  loading: () => <p className="py-20 text-sm text-neutral-500">Loading form…</p>
});

export default function VolunteerPage() {
  return (
    <AppContainer
      curMenu="Volunteer"
      description="Join the Projct crew. Bring your skills, share your time and help make music happen."
    >
      <section className="relative overflow-hidden bg-black px-6 py-20 text-white sm:px-[10%] sm:py-28">
        <Image
          src="/content/about-crowd.webp"
          fill
          sizes="100vw"
          preload
          alt="A crowd coming together for live music"
          className="object-cover opacity-35"
        />
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            Behind every great show
          </p>
          <h1 className="text-4xl font-extrabold uppercase leading-tight sm:text-6xl">
            There&apos;s a<br />
            great crew.
          </h1>
          <p className="mt-6 max-w-md text-base font-light leading-7 text-neutral-200">
            Bring your energy, your ideas and a little of your time. Let&apos;s build something
            worth being part of.
          </p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
        <h2 className="mb-3 text-xl font-extrabold uppercase tracking-wide">
          Join Projct&apos;s crew
        </h2>
        <p className="mb-10 text-sm leading-7 text-neutral-500">
          Tell us a little about yourself. From photography to live events, every skill has a place.
        </p>
        <CommunityForm volunteer />
      </section>
    </AppContainer>
  );
}
