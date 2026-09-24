import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { LinkIcon } from "@heroicons/react/20/solid";
import toast from "react-hot-toast";

export default function ShareLinks({ href, title }) {
  const [origin, setOrigin] = useState("https://projctmusic.com");
  const url = `${origin}${href}`;
  const circle =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-pmred hover:text-pmred focus-visible:outline-2 focus-visible:outline-pmred";
  function useLocalOrigin() {
    setOrigin(window.location.origin);
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Copy the address from your browser instead.");
    }
  }
  return (
    <div
      className="flex items-center gap-2"
      aria-label="Share article"
      onPointerEnter={useLocalOrigin}
      onFocus={useLocalOrigin}
    >
      <a
        className={circle}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${title} on Facebook`}
      >
        <FontAwesomeIcon icon={faFacebookF} className="h-3 w-3" />
      </a>
      <a
        className={circle}
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${title} on Twitter`}
      >
        <FontAwesomeIcon icon={faTwitter} className="h-3 w-3" />
      </a>
      <button
        type="button"
        className={circle}
        onClick={copyLink}
        aria-label={`Copy link to ${title}`}
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
