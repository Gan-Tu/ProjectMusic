import dynamic from "next/dynamic";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitch,
  faYoutube,
  faVimeoV,
  faFacebookF,
  faInstagram,
  faTumblr,
  faVine,
  faPinterestP,
  faSoundcloud,
  faTwitter
} from "@fortawesome/free-brands-svg-icons";
import AppContainer from "../components/AppContainer";
import Button from "../components/ui/Button";
import { useUI } from "../lib/ui";

const CommunityForm = dynamic(() => import("../components/content/CommunityForm"), {
  ssr: false,
  loading: () => <p className="py-20 text-sm text-neutral-400">Loading form…</p>
});
const networks = [
  ["Twitch", faTwitch, "/socials"],
  ["YouTube", faYoutube, "/socials/youtube"],
  ["Vimeo", faVimeoV, "/socials/vimeo"],
  ["Facebook", faFacebookF, "/socials/facebook"],
  ["Instagram", faInstagram, "/socials/instagram"],
  ["Tumblr", faTumblr, "/socials/tumblr"],
  ["Vine", faVine, "/socials/vine"],
  ["Pinterest", faPinterestP, "/socials/pinterest"],
  ["SoundCloud", faSoundcloud, "/socials/soundcloud"],
  ["Twitter", faTwitter, "/socials/twitter"]
];

export default function ContactPage() {
  const { openModal } = useUI();
  return (
    <AppContainer
      curMenu="Contact"
      description="Get in touch with Projct Music and Truth Studios. Find us online or leave a message."
    >
      <section className="px-5 py-16 text-center sm:py-24">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Let&apos;s make something happen
        </p>
        <h1 className="text-[clamp(1.1rem,3.5vw,3rem)] font-extrabold uppercase tracking-tight text-pmred">
          <a href="mailto:contact@projctmusic.com" className="hover:text-pmred-dark">
            Contact@projctmusic.com
          </a>
        </h1>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest">
          Customer service & studio contact
        </p>
      </section>
      <section className="bg-neutral-100 px-5 py-12 sm:py-16" aria-label="Find us on social media">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px bg-neutral-200 sm:grid-cols-5">
          {networks.map(([name, icon, href]) => (
            <Link
              key={name}
              href={href}
              className={`flex min-h-32 flex-col items-center justify-center gap-4 px-2 py-7 transition-colors hover:bg-pmred hover:text-white ${name === "YouTube" ? "bg-pmred text-white" : "bg-white text-pmred"}`}
            >
              <FontAwesomeIcon icon={icon} className="h-7 w-7" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{name}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_2fr] sm:px-10 sm:py-20">
        <div>
          <h2 className="text-2xl font-extrabold uppercase">Drop us a line.</h2>
          <p className="mt-5 text-sm font-light leading-7 text-neutral-500">
            Have a session in mind, a question about the shop or something we should hear? Start
            here.
          </p>
          <div className="mt-8 border-t border-neutral-200 pt-8">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest">Stay in the loop</p>
            <Button variant="outline" onClick={() => openModal("sms")} className="cursor-pointer">
              Text me updates
            </Button>
          </div>
        </div>
        <CommunityForm />
      </section>
    </AppContainer>
  );
}
