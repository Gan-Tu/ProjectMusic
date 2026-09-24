import { seededRandom } from "../lib/format";

const S3 = "https://s3.amazonaws.com/projctmusic.com";

const COMMENTERS = [
  { author: "Kelsey Lu", avatar: `${S3}/kelsey_lu_500x500_8923114767191121302.jpg` },
  { author: "Joey Purp", avatar: `${S3}/joey_purp_500x500_9547114865041342796.jpg` },
  { author: "Little Simz", avatar: `${S3}/little_simz_500x500_4944914752144939467.jpg` },
  { author: "Smino", avatar: `${S3}/smino_500x500_3314714878444994791.jpg` },
  { author: "Noname", avatar: `${S3}/noname_500x500_6320314752154489401.jpg` },
  { author: "Mick Jenkins", avatar: `${S3}/mickjenkins_500x500_2500414752151823296.jpg` },
  { author: "Jean Deaux", avatar: `${S3}/jean_deaux_500x500_3892614877981139984.jpg` },
  { author: "Towkio", avatar: `${S3}/towkio_500x500_8529914878447540057.jpg` },
  { author: "Whitney", avatar: `${S3}/whitney_500x500_395561486504786038.jpg` },
  { author: "Raury", avatar: `${S3}/raury_500x500_8322814878444142724.jpeg` },
  { author: "VanJess", avatar: `${S3}/vanjess_500x500_4619514952744056253.jpg` },
  { author: "Moses Sumney", avatar: `${S3}/moses_sumney_500x500_2724914752152510773.jpg` }
];

const TEXTS = [
  "This is on repeat all week. The low end on this mix is unreal.",
  "Saw this live at Truth Studios, the energy was crazy 🔥",
  "Can we get the stems? Would love to flip this.",
  "Production is so clean. Who engineered this?",
  "That second verse though…",
  "Been waiting for this one for a minute. Worth it.",
  "The vocals sit perfectly in the mix. Respect.",
  "Adding this to every playlist I have.",
  "Need the vinyl pressing ASAP.",
  "Chills from the first chord. Beautiful work.",
  "Studio sessions like this are why I follow Projct Music.",
  "Nick Breton never misses."
];

const LABELS = [
  "2 hours ago",
  "5 hours ago",
  "1 day ago",
  "3 days ago",
  "1 week ago",
  "2 weeks ago"
];

// Deterministic "other people's" comments for a thread (same output on server and client).
export function getSeedComments(threadId, count) {
  const rand = seededRandom(`comments:${threadId}`);
  const total = count ?? 1 + Math.floor(rand() * 4);
  const start = Math.floor(rand() * TEXTS.length);
  return Array.from({ length: total }, (_, i) => {
    const person = COMMENTERS[Math.floor(rand() * COMMENTERS.length)];
    return {
      id: `${threadId}#seed-${i}`,
      ...person,
      text: TEXTS[(start + i * 5) % TEXTS.length],
      label: LABELS[Math.min(LABELS.length - 1, i + Math.floor(rand() * 2))],
      likes: Math.floor(rand() * 40)
    };
  });
}
