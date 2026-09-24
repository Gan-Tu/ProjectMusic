import AppContainer from "../components/AppContainer";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <AppContainer title="Page not found" curMenu="Explore">
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 py-20 text-center text-white">
        <p className="text-[clamp(7rem,22vw,15rem)] font-extralight leading-none tracking-tight text-pmred">
          404
        </p>
        <h1 className="mt-8 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
          This track is missing.
        </h1>
        <p className="mt-5 max-w-md text-sm font-light leading-7 text-neutral-400">
          The page may have moved, but the music is still here. Find your way back into the mix.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/" size="md">
            Home
          </Button>
          <Button href="/musics" variant="light" size="md">
            Music
          </Button>
          <Button href="/shop" variant="light" size="md">
            Shop
          </Button>
        </div>
      </div>
    </AppContainer>
  );
}
