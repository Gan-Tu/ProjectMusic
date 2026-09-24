import Image from "../components/ui/SmartImage";
import AppContainer from "../components/AppContainer";
import Button from "../components/ui/Button";
import SongCounter from "../components/content/SongCounter";
import { useUI } from "../lib/ui";

export default function AboutPage() {
  const { openModal } = useUI();
  return (
    <AppContainer
      curMenu="About"
      description="Respect is everything. Meet the people and the spirit behind Truth Studios and Projct Music."
    >
      <section className="relative flex min-h-110 items-center justify-center overflow-hidden bg-pmred px-6 py-20 text-center text-white sm:min-h-140">
        <Image
          src="/content/about-crowd.webp"
          alt="Hands raised in a concert crowd"
          fill
          sizes="100vw"
          preload
          className="object-cover"
        />
        <div className="absolute inset-0 bg-pmred/30" />
        <div className="relative max-w-2xl">
          <p className="mb-7 text-xs font-bold uppercase tracking-[0.25em]">
            About us / Truth Studios
          </p>
          <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-wide sm:text-5xl">
            Respect is everything
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base font-light leading-7 text-white/90">
            For the music. For the process. For every person in the room. We are grateful to keep
            creating with people who care as much as we do.
          </p>
        </div>
      </section>
      <section className="bg-black px-6 py-16 text-white sm:px-[12%] sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <SongCounter />
          <p className="max-w-sm text-sm font-light leading-7 text-neutral-400">
            Every song has a story. Every session starts with listening. This is our love letter to
            the artists, the late nights and the ideas that keep us moving.
          </p>
        </div>
      </section>
      <section className="grid bg-white md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-[15%] sm:py-24 md:text-right">
          <h2 className="text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
            <span className="text-pmred">The best</span>
            <br />
            American
            <br />
            <span className="text-pmred">Musician</span>
          </h2>
          <p className="mt-8 text-sm font-light leading-8 text-neutral-500">
            There is no single sound that defines our studio. From a first verse to a full-band
            performance, we help artists find the version that feels like them. The best moments
            happen when everyone brings something honest to the room.
          </p>
          <Button
            href="/artists"
            variant="outline"
            className="mt-8 w-fit cursor-pointer md:self-end"
          >
            Meet the artists
          </Button>
        </div>
        <div className="relative min-h-100 overflow-hidden bg-neutral-900">
          <Image
            src="/content/about-artist.webp"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            alt="Artist in a quiet moment at the studio"
            className="object-cover grayscale"
          />
        </div>
      </section>
      <figure className="bg-neutral-950 px-6 py-20 text-center sm:py-28">
        <blockquote className="mx-auto max-w-3xl text-2xl font-extralight leading-relaxed text-neutral-200 sm:text-3xl">
          “The best part of making music is that moment when an idea becomes something everyone in
          the room can feel.”
        </blockquote>
        <figcaption className="mt-8 text-xs font-bold uppercase tracking-widest text-pmred-light">
          Nick Breton / Truth Studios
        </figcaption>
      </figure>
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-pmred">
              Los Angeles, California
            </p>
            <h2 className="text-3xl font-extrabold uppercase">
              One studio.
              <br />
              Many perspectives.
            </h2>
          </div>
          <p className="text-sm font-light leading-8 text-neutral-500">
            Truth Studios is a home for independent thought and shared work. Producers, engineers,
            photographers and artists come together here to make something that lasts beyond the
            session.
          </p>
        </div>
        <ul className="mt-12 grid divide-y divide-neutral-200 border-y border-neutral-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            [
              "01",
              "Nick Breton",
              "Producer & studio founder",
              "The ears behind the board, helping every idea find its place."
            ],
            [
              "02",
              "The studio crew",
              "Engineers & collaborators",
              "Careful listening, honest feedback and an open door to new sounds."
            ],
            [
              "03",
              "The community",
              "Artists & music lovers",
              "The reason we press record. The people who keep it playing."
            ]
          ].map(([number, name, role, description]) => (
            <li key={number} className="py-8 md:px-6">
              <span className="text-4xl font-extralight text-pmred">{number}</span>
              <h3 className="mt-5 text-sm font-bold uppercase tracking-wide">{name}</h3>
              <p className="mt-2 text-xs text-pmred">{role}</p>
              <p className="mt-4 text-sm font-light leading-6 text-neutral-500">{description}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
          <p className="text-lg font-light">There&apos;s always room for another voice.</p>
          <div className="flex gap-3">
            <Button onClick={() => openModal("newsletter")} className="cursor-pointer" size="md">
              Join list
            </Button>
            <Button href="/contact" variant="outline" size="md">
              Contact
            </Button>
          </div>
        </div>
      </section>
    </AppContainer>
  );
}
