const POSTS = [
  {
    id: 0,
    title: "A room, a guitar, a new beginning",
    date: "September 22, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-1.webp",
    snippet: "An acoustic session reminds us why the first take can be the one worth keeping.",
    category: "Sessions",
    tags: ["Acoustic", "Truth Studios"],
    body: [
      "The session started with a guitar, a notebook and a melody that nobody wanted to lose. We kept the room quiet and let the arrangement follow the vocal. What began as a writing exercise became a song with its own direction.",
      "Instead of filling every space, we left the little pauses intact. You can hear fingers moving across the strings and the breath before the chorus. Those details are part of the performance, not something to edit away.",
      "The final playback felt like being in the room again. Find more stripped-back performances in our music collection, and join the list for the next studio release."
    ]
  },
  {
    id: 1,
    title: "New voices, familiar feelings",
    date: "September 20, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-2.webp",
    snippet: "Meet the independent voices shaping our next round of studio sessions.",
    category: "Artists",
    tags: ["Artists", "Los Angeles"],
    body: [
      "Our favorite discoveries rarely arrive with a big introduction. Sometimes it is a demo from a friend, or a voice coming through the wall while another session wraps up. This month we are making room for those unexpected connections.",
      "Each artist brings a different vocabulary to the studio. We build the session around that identity, whether it calls for a live band or a single drum machine.",
      "The new sessions will live alongside interviews and photographs, giving listeners a little more of the story behind each recording."
    ]
  },
  {
    id: 2,
    title: "Made for the late nights",
    date: "September 18, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-3.webp",
    snippet:
      "A first look at the next Projct collection, built around the people behind the music.",
    category: "Culture",
    tags: ["Merch", "Community"],
    body: [
      "The next collection began with a stack of sketches on the studio desk. We wanted pieces that felt at home at a show, on the road and on the long walk back after a late session.",
      "Simple shapes and a small flash of red carry the Projct identity. The design is intentionally quiet so the person wearing it can do the talking.",
      "Explore the shop for the demo collection, including records and everyday essentials inspired by the studio."
    ]
  },
  {
    id: 3,
    title: "What does talent sound like?",
    date: "September 16, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-4.webp",
    snippet: "Four different perspectives on finding a voice and building something together.",
    category: "Artists",
    tags: ["Collaboration", "Artists"],
    body: [
      "Ask a room of musicians what talent means and you will get a room full of answers. Some talk about instinct. Others talk about the hours spent practicing when nobody is listening.",
      "In a collaborative session, listening matters as much as playing. The best idea can come from the quietest person in the room, if everyone leaves enough space to hear it.",
      "Our latest artist conversations explore that balance: preparation, curiosity and the willingness to try one more take."
    ]
  },
  {
    id: 4,
    title: "Turn it up, bring your friends",
    date: "September 14, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-5.webp",
    snippet: "A night for loud guitars, familiar faces and the shared energy of a live room.",
    category: "Live",
    tags: ["Live", "Community"],
    body: [
      "There is a particular moment before the first song when the crowd seems to take one breath together. That is the feeling we want to bring to our next listening night.",
      "The program moves from intimate performances to full-band sets, with time between them to meet the artists and discover something new.",
      "Visit the events calendar to explore upcoming demo events and save your favorites."
    ]
  },
  {
    id: 5,
    title: "Back in the booth",
    date: "September 12, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-6.webp",
    snippet: "A look inside a focused recording day where every verse found its place.",
    category: "Sessions",
    tags: ["Recording", "Truth Studios"],
    body: [
      "A good vocal session starts before the microphone is switched on. We listened to references, talked through the lyrics and found the right pace for the day.",
      "By the third pass, the performance had settled into its own pocket. We kept the strongest complete takes and made only the edits that helped the story move forward.",
      "The session photographs capture the concentration between takes: headphones down, a quick note, then straight back into the booth."
    ]
  },
  {
    id: 6,
    title: "After hours at Truth",
    date: "September 10, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-7.webp",
    snippet: "When the schedule ends, the most unexpected ideas sometimes begin.",
    category: "Studio",
    tags: ["Los Angeles", "Recording"],
    body: [
      "The last booked session was over, but a loop was still playing through the monitors. One person picked up a keyboard and another started tapping out a new rhythm.",
      "Without a deadline in the room, the arrangement took a different turn. A small sketch grew into a beat we all wanted to hear again the next morning.",
      "These after-hours experiments are a reminder to keep the recorder ready and leave a little room for accidents."
    ]
  },
  {
    id: 7,
    title: "The next chapter starts here",
    date: "September 8, 2026",
    author: "Nick Breton",
    imgUrl: "/content/news-8.webp",
    snippet: "More sessions, more stories and more ways to be part of Projct Music.",
    category: "Community",
    tags: ["Community", "Truth Studios"],
    body: [
      "Projct Music brings the things we love into one place: records, performances, photographs and conversations with the people who make them.",
      "The next chapter is about opening that door a little wider. We are collecting new stories from the studio and inviting our community to take part.",
      "If you want to help with events, photography or the everyday work behind a release, visit the volunteer page and tell us what you love doing."
    ]
  }
];

export const getNews = () => POSTS;

export const getNewsById = (id) => POSTS.find((post) => String(post.id) === String(id));

export const getRelatedNews = (id) => {
  const current = getNewsById(id);
  if (!current) return [];
  return POSTS.filter((post) => post.id !== current.id)
    .sort(
      (a, b) =>
        b.tags.filter((tag) => current.tags.includes(tag)).length -
        a.tags.filter((tag) => current.tags.includes(tag)).length
    )
    .slice(0, 2);
};
