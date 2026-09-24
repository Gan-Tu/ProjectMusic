import { getMusics, albumToTrack } from "./getFakeTracks";
import { getArtistHomePageData } from "./getFakeArtistsData";
import { getVideoSrc } from "../lib/media";

const NETWORKS = [
  [
    "instagram",
    "Instagram",
    "@truthstudios",
    28400,
    "https://www.instagram.com/truthstudios/",
    "#b44c76",
    "faInstagram"
  ],
  [
    "youtube",
    "YouTube",
    "@truthstudios",
    18200,
    "https://www.youtube.com/@truthstudios",
    "#e62117",
    "faYoutube"
  ],
  [
    "twitter",
    "Twitter",
    "@truthstudios",
    12600,
    "https://twitter.com/truthstudios",
    "#249bce",
    "faTwitter"
  ],
  [
    "soundcloud",
    "SoundCloud",
    "truthstudios",
    9400,
    "https://soundcloud.com/truthstudios",
    "#f26625",
    "faSoundcloud"
  ],
  [
    "facebook",
    "Facebook",
    "Truth Studios",
    21800,
    "https://www.facebook.com/truthstudios/",
    "#4267a9",
    "faFacebookF"
  ],
  ["tumblr", "Tumblr", "truthstudios", 3600, "https://www.tumblr.com/", "#35465c", "faTumblr"],
  ["vimeo", "Vimeo", "Truth Studios", 4200, "https://vimeo.com/", "#39a9c9", "faVimeoV"],
  ["myspace", "Myspace", "Truth Studios", 8400, "https://myspace.com/", "#174a9a", "friends"],
  ["vine", "Vine", "Truth Studios", 6100, "https://vine.co/", "#008f70", "faVine"],
  [
    "pinterest",
    "Pinterest",
    "Truth Studios",
    2900,
    "https://www.pinterest.com/",
    "#c8232c",
    "faPinterestP"
  ],
  [
    "wikipedia",
    "Wikipedia",
    "Truth Studios / Nick Breton",
    1240,
    "https://en.wikipedia.org/wiki/Music_producer",
    "#555555",
    "faWikipediaW"
  ]
];

export function getSocialProfiles() {
  return NETWORKS.map(([id, name, handle, followers, url, color, icon]) => ({
    id,
    name,
    handle,
    followers,
    url,
    color,
    icon
  }));
}

const CAPTIONS = [
  "The first take always has something special. Back in the live room. #TruthStudios",
  "Six strings. A quiet room. A new beginning.",
  "Taking the long way back to the studio. Los Angeles, you sound good.",
  "A little color for your timeline. Good things on the way. #WarmWeather",
  "Music finds a way out of every room.",
  "No stage required. Just something worth sharing.",
  "Different instruments, same language. #MakeMusic",
  "Nothing quite like the energy of a live vocal.",
  "A moment of quiet before the next session.",
  "Working out the chords until everything clicks.",
  "Strings in the afternoon. Keep the room microphones rolling.",
  "Let the music move you. Behind the scenes from our latest session.",
  "Your voice belongs here. New sessions coming soon.",
  "Out of the studio and into the city. Inspiration is everywhere.",
  "Between takes. A portrait from the archive.",
  "One more song before we call it a night. #TruthStudios"
];
const ALTS = [
  "Close-up of a sunburst electric guitar",
  "Blue acoustic guitar in soft light",
  "Street lamps in the morning haze",
  "Red balloons floating against a blue sky",
  "Upright piano on a city sidewalk",
  "Street musician playing guitar in black and white",
  "Musicians playing accordion and violin in an alley",
  "Singer performing under purple stage lighting",
  "Weathered wood and metal railing",
  "Close-up of black and white piano keys",
  "Cellist playing in a sunlit room",
  "Dancer moving beside an acoustic guitar",
  "Microphone resting on a dark surface",
  "People walking along a lively city street",
  "Portrait of a musician between takes",
  "Guitarist performing in black and white"
];

function photos() {
  return CAPTIONS.map((caption, i) => ({
    id: `photo-${i + 1}`,
    image: `/socials/studio-${String(i + 1).padStart(2, "0")}.webp`,
    alt: ALTS[i],
    caption,
    date: `2026-09-${String(22 - i).padStart(2, "0")}`,
    likes: 148 + i * 37,
    comments: 3 + ((i * 7) % 31),
    conversation: [
      {
        author: "studiofriends",
        text: [
          "That tone is everything.",
          "Always making something beautiful.",
          "More of this, please.",
          "The best kind of studio day."
        ][i % 4]
      },
      { author: "nickbreton", text: "Thanks for listening. More on the way!" }
    ]
  }));
}

const TWEETS = [
  "For studio rental, recording sessions, mixing and mastering, find us at @TruthStudios. Let's make something you love. #LosAngeles",
  "A room full of musicians and not a clock in sight. These are the days. #StudioLife",
  "Shout out to @AsherRoth for bringing that energy to the session. First take, straight from the heart.",
  "New sounds from the live room. Headphones on, world off. #NowPlaying #TruthStudios",
  "The best part of producing is the moment an idea becomes a song. Still gets me every time.",
  "Thank you to everyone who came through last night. Same time next week? #Community",
  "Happy birthday to our friends making music everywhere. Keep going. Someone needs to hear your song.",
  "20 years of listening closely. Here's to the next chapter at @TruthStudios. #IndependentMusic",
  "Sometimes the demo is the record. Trust your ears.",
  "Coffee, fresh strings, a blank session. Monday is looking good. #InTheStudio",
  "Sending love to @CamObi and everyone putting something honest into the world.",
  "Tonight's listening: soul records and a little silence between them. What are you playing? #OnRepeat",
  "Keep the mistakes that make it human. #RecordingNotes",
  "Doors open. Cables down. We're ready when you are. @TruthStudios",
  "A great song doesn't need permission. Make it. Share it. Start the next one.",
  "From our little room in Los Angeles to wherever you're listening: thank you. #TruthStudios"
];

const ARTICLE = {
  title: "Truth Studios",
  subtitle: "Independent recording studio and creative community",
  intro:
    "Truth Studios is a Los Angeles recording studio associated with producer and engineer Nick Breton. Projct Music brings its world of recording sessions, artists, photography and independent releases together in one place.",
  facts: [
    ["Type", "Recording studio"],
    ["Location", "Los Angeles, California"],
    ["Producer", "Nick Breton"],
    ["Focus", "Recording, production, mixing"],
    ["Project", "Projct Music"]
  ],
  sections: [
    {
      id: "overview",
      title: "Overview",
      paragraphs: [
        "At the center of Truth Studios is a simple idea: give artists the space to make music that feels like their own. The studio brings musicians, producers and engineers into a collaborative recording environment.",
        "This demonstration profile collects a fictional studio archive. The posts, release chronology and community statistics shown here are sample content, rather than a verified biography or an official Wikipedia entry."
      ]
    },
    {
      id: "nick-breton",
      title: "Nick Breton",
      paragraphs: [
        "Nick Breton is the producer at the center of the Projct Music experience. Here, his profile connects the work inside the studio with the people, images and conversations around it.",
        "The studio journal follows the creative process from an early idea to a finished mix, with room for experiments, live performances and collaboration along the way."
      ]
    },
    {
      id: "recording",
      title: "Recording and production",
      paragraphs: [
        "The studio archive explores live tracking, vocal recording, arrangement and mixing. Sessions pair traditional instruments with contemporary production, documenting both the finished work and the process behind it."
      ]
    }
  ],
  discography: [
    ["2026", "Warm Weather", "Studio compilation", "Production / mixing"],
    ["2025", "Live from the Room", "Live sessions", "Recording / engineering"],
    ["2024", "After Hours", "Instrumental collection", "Production"],
    ["2023", "The Session Archive", "Studio compilation", "Recording / mixing"]
  ],
  references: [
    { title: "Projct Music — artist directory", href: "/artists" },
    { title: "Truth Studios — session photographs", href: "/socials/instagram" },
    { title: "Projct Music — listening archive", href: "/socials/soundcloud" }
  ]
};

export function getSocialPage(network) {
  const profile = getSocialProfiles().find((item) => item.id === network);
  if (!profile) return null;
  // Namespace post ids per network: likes and comment threads are keyed by id.
  const images = photos().map((post) => ({ ...post, id: `${network}-${post.id}` }));
  let content;
  switch (network) {
    case "instagram":
      content = { posts: images };
      break;
    case "twitter":
      content = {
        posts: TWEETS.map((text, i) => ({
          id: `tweet-${i + 1}`,
          text,
          date: images[i].date,
          likes: 24 + i * 13,
          replies: 2 + (i % 8),
          retweets: 7 + i * 3
        }))
      };
      break;
    case "facebook":
      content = {
        posts: images.slice(0, 8).map((post, i) => ({
          ...post,
          image: i % 3 === 1 ? null : post.image,
          caption: `${post.caption} ${["A little look at what we've been working on. Thanks for being part of the community.", "Good people, good music, and a little room to experiment. That's what it's all about.", "There is nothing better than hearing an idea come to life. Come spend a day in the studio with us."][i % 3]}`
        }))
      };
      break;
    case "tumblr":
      content = {
        posts: images.slice(0, 9).map((post, i) => ({
          ...post,
          type: ["photo", "quote", "text"][i % 3],
          title: ["Notes from the live room", "On making things", "The studio journal"][i % 3]
        }))
      };
      break;
    case "pinterest":
      content = {
        posts: images.map((post, i) => ({
          ...post,
          ratio: ["3 / 4", "1 / 1", "4 / 5", "2 / 3"][i % 4],
          board: ["Studio details", "Inspiration", "Life in music", "The live room"][i % 4]
        }))
      };
      break;
    case "youtube":
    case "vimeo":
    case "vine": {
      const artists = getArtistHomePageData().slice(0, network === "vine" ? 6 : 9);
      content = {
        posts: artists.map((artist, i) => ({
          id: `${network}-${i}`,
          image: artist.imgUrl,
          alt: `${artist.name} studio session`,
          title: `${artist.name} — ${["Live in the studio", "Behind the session", "One take", "The listening room"][i % 4]}`,
          caption: "A moment from the Truth Studios archive. Demo playback uses a sample film.",
          src: getVideoSrc(`${network}-${i}`),
          date: images[i].date,
          views: 1820 + i * 1241,
          duration: network === "vine" ? "0:06" : "Preview"
        }))
      };
      break;
    }
    case "soundcloud":
      content = {
        tracks: getMusics().slice(0, 16).map(albumToTrack)
      };
      break;
    case "myspace":
      content = {
        friends: getArtistHomePageData().slice(0, 8),
        tracks: getMusics().slice(0, 8).map(albumToTrack)
      };
      break;
    case "wikipedia":
      content = { article: ARTICLE };
      break;
    default:
      return null;
  }
  return { profile, content };
}
