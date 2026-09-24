import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faYoutube,
  faTwitter,
  faSoundcloud,
  faFacebookF,
  faTumblr,
  faVimeoV,
  faVine,
  faPinterestP,
  faWikipediaW
} from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRightIcon, UsersIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { formatNumber } from "../../lib/format";

const ICONS = {
  faInstagram,
  faYoutube,
  faTwitter,
  faSoundcloud,
  faFacebookF,
  faTumblr,
  faVimeoV,
  faVine,
  faPinterestP,
  faWikipediaW
};

export function SocialIcon({ profile, className = "h-12 w-12" }) {
  return (
    <span
      style={{ backgroundColor: profile.color }}
      className={`inline-flex shrink-0 items-center justify-center text-2xl text-white ${className}`}
      aria-hidden="true"
    >
      {ICONS[profile.icon] ? (
        <FontAwesomeIcon icon={ICONS[profile.icon]} className="h-6 w-6" />
      ) : (
        <UsersIcon className="h-6 w-6" />
      )}
    </span>
  );
}

export function FollowButton({ profile }) {
  const { state, actions } = useStore();
  const following = Boolean(state.follows[`social:${profile.id}`]);
  const isLike = profile.id === "facebook";
  return (
    <Button
      variant={following ? "primary" : "outline"}
      size="sm"
      className="min-w-24 cursor-pointer"
      aria-pressed={following}
      aria-label={`${following ? (isLike ? "Unlike" : "Unfollow") : isLike ? "Like" : "Follow"} ${profile.name}`}
      onClick={() => {
        actions.toggleFollow(`social:${profile.id}`);
        toast.success(
          following ? `${profile.name} unfollowed` : `You're following ${profile.name}`
        );
      }}
    >
      {following ? (isLike ? "Liked" : "Following") : isLike ? "Like" : "Follow"}
    </Button>
  );
}

export default function SocialProfile({ profile, count }) {
  const { state } = useStore();
  return (
    <section
      aria-label={`${profile.name} profile`}
      className="flex flex-wrap items-center justify-between gap-5 border-b border-neutral-200 bg-white px-5 py-6 sm:px-10 lg:px-14"
    >
      <div className="flex min-w-0 items-center gap-4">
        <SocialIcon profile={profile} />
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold uppercase tracking-[0.16em]">{profile.name}</h1>
          <p className="mt-1 break-words text-xs text-neutral-500">{profile.handle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 text-xs">
        <p className="text-neutral-500">
          <strong className="font-semibold text-neutral-900">
            {formatNumber(profile.followers + (state.follows[`social:${profile.id}`] ? 1 : 0))}
          </strong>{" "}
          followers
          {count != null && (
            <span className="ml-4">
              <strong className="font-semibold text-neutral-900">{count}</strong>{" "}
              {profile.id === "soundcloud" ? "tracks" : "posts"}
            </span>
          )}
        </p>
        <FollowButton profile={profile} />
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-1 text-neutral-500 hover:text-pmred"
        >
          Open on {profile.name}
          <ArrowUpRightIcon className="h-4 w-4" />
          <span className="sr-only"> (new tab)</span>
        </a>
        <Link
          href="/socials"
          className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-pmred hover:underline"
        >
          All socials
        </Link>
      </div>
    </section>
  );
}
