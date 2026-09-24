import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import { SocialIcon, FollowButton } from "../../components/socials/SocialProfile";
import { listSocialNetworks } from "../../lib/server/content";
import { formatNumber } from "../../lib/format";
import { useStore } from "../../lib/store";

export default function SocialsPage({ profiles }) {
  const { state } = useStore();
  return (
    <AppContainer
      title="Follow / Like"
      curMenu="Follow / Like"
      description="The sounds, stories and people of Truth Studios. Follow the studio across our social channels."
    >
      <div className="border-b border-neutral-200 px-6 py-10 sm:px-12">
        <p className="mb-3 text-2xs font-bold uppercase tracking-[0.24em] text-pmred">
          Truth Studios · Los Angeles
        </p>
        <h1 className="text-xl font-extrabold uppercase tracking-[0.16em]">Follow / Like</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Sessions, sounds, and everything in between. Stay connected.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {profiles.map((profile) => (
          <article
            key={profile.id}
            className="group flex items-center gap-4 border-b border-neutral-200 px-5 py-8 transition-colors hover:bg-neutral-50 sm:gap-6 sm:px-12 md:odd:border-r"
          >
            <Link
              href={`/socials/${profile.id}`}
              aria-label={`Explore ${profile.name}`}
              className="cursor-pointer"
            >
              <SocialIcon profile={profile} className="h-14 w-14 sm:h-18 sm:w-18" />
            </Link>
            <Link href={`/socials/${profile.id}`} className="min-w-0 flex-1 cursor-pointer">
              <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider group-hover:text-pmred">
                {profile.name}
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </h2>
              <p className="mt-1.5 truncate text-xs text-neutral-500">{profile.handle}</p>
              <p className="mt-1 text-2xs text-neutral-500">
                {formatNumber(profile.followers + (state.follows[`social:${profile.id}`] ? 1 : 0))}{" "}
                followers
              </p>
            </Link>
            <FollowButton profile={profile} />
          </article>
        ))}
      </div>
    </AppContainer>
  );
}

export async function getStaticProps() {
  return { props: { profiles: await listSocialNetworks() }, revalidate: 60 };
}
