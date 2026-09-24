const POSTS = [
  {
    id: 0,
    title: "Finding the pocket",
    date: "September 22, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-1.webp",
    snippet: "Why a great performance often starts with leaving a little more space.",
    category: "Process",
    tags: ["Production", "Performance"],
    body: [
      "I used to reach for another layer whenever a track felt unfinished. These days I am more likely to mute something and listen again. Space can give a groove the confidence that another instrument takes away.",
      "On a recent session we pulled the drums back to a kick, a snare and a loose shaker. The vocal suddenly felt closer, and the bass had room to answer it.",
      "Try listening to your next arrangement at a low volume. If the pulse and the story still come through, you probably have more of the record than you think."
    ]
  },
  {
    id: 1,
    title: "A sound of your own",
    date: "September 20, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-2.webp",
    snippet:
      "References are a starting point. The interesting part is where you leave them behind.",
    category: "Perspective",
    tags: ["Artists", "Creativity"],
    body: [
      "Reference records give us a shared language in the studio. They help us describe a texture or a feeling before we have found the words for it.",
      "The trouble starts when a reference becomes a rule. I want to know what an artist hears in a record, then help them turn that feeling into something personal.",
      "Keep the influence, but change the question. Instead of asking how to reproduce a sound, ask what made it matter to you."
    ]
  },
  {
    id: 2,
    title: "A little analog warmth",
    date: "September 18, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-3.webp",
    snippet: "Notes on old equipment, happy accidents and knowing when to stop turning knobs.",
    category: "Studio notes",
    tags: ["Gear", "Production"],
    body: [
      "An old piece of equipment can make you work differently. A limited set of controls asks you to commit earlier and trust the choices you make.",
      "That does not mean every track needs tape or a vintage compressor. Sometimes the cleanest path is exactly the right one. Tools should support a feeling, not become the point of the record.",
      "My favorite part of an analog workflow is the moment you stop comparing options and simply listen to the music coming back."
    ]
  },
  {
    id: 3,
    title: "Keep the first take",
    date: "September 16, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-4.webp",
    snippet: "A reminder to capture the idea before trying to perfect it.",
    category: "Process",
    tags: ["Recording", "Performance"],
    body: [
      "The first take often carries an energy that is difficult to recreate. The artist is discovering the song as they perform it, and that discovery becomes part of the sound.",
      "We still record more passes. There are words to clarify and moments to explore. But I always keep that early performance close by as a reference for the feeling we started with.",
      "Before you replace a take because it is imperfect, listen once without looking at the waveform. The answer is usually easier to hear than to see."
    ]
  },
  {
    id: 4,
    title: "The city between sessions",
    date: "September 14, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-5.webp",
    snippet: "A few blocks away from the studio, another rhythm is always waiting.",
    category: "Journal",
    tags: ["Los Angeles", "Creativity"],
    body: [
      "A short walk can do more for a difficult mix than another hour in the chair. Outside, there are conversations, passing cars and rhythms that have nothing to do with the session.",
      "Los Angeles gives you a different soundtrack on every block. I keep small voice notes of ideas, then forget about them until the next time I need a starting point.",
      "Coming back with fresh ears is part of the work. Rest is not empty space in the process; it changes what you are able to hear."
    ]
  },
  {
    id: 5,
    title: "Notes in the margins",
    date: "September 12, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-6.webp",
    snippet: "The sketches and small observations that eventually become a finished song.",
    category: "Journal",
    tags: ["Songwriting", "Creativity"],
    body: [
      "A song does not always begin with a chorus. Sometimes it starts with a sentence written in the corner of a notebook while something else is happening.",
      "I like keeping fragments without deciding what they are for. A rhythm, an image or an unfinished line can find its partner weeks later.",
      "Give your ideas somewhere to land before you judge them. An ordinary observation can become the detail that makes a lyric feel real."
    ]
  },
  {
    id: 6,
    title: "Make room for the voice",
    date: "September 10, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-7.webp",
    snippet: "A practical approach to building an arrangement around the person singing it.",
    category: "Process",
    tags: ["Vocals", "Production"],
    body: [
      "The vocal is where most listeners meet a song. When an arrangement becomes crowded, I start by finding the words that need to be understood and the moments that need to breathe.",
      "Small changes can make a big difference: a guitar resting for half a bar, a keyboard moving up an octave, a backing vocal arriving a little later.",
      "The goal is not to make everything quieter. It is to give each part a clear reason to be there, especially when the singer has something important to say."
    ]
  },
  {
    id: 7,
    title: "The record after the record",
    date: "September 8, 2026",
    author: "Nick Breton",
    imgUrl: "/content/blog-8.webp",
    snippet: "What stays with us once the final bounce is finished.",
    category: "Perspective",
    tags: ["Community", "Listening"],
    body: [
      "Finishing a record is a strange feeling. A world that filled the room for weeks suddenly fits inside one file, ready to travel somewhere we may never see.",
      "What stays with me is usually a moment between takes: a joke, a breakthrough or the first playback that made everyone look up. Those things are in the music even when you cannot name them.",
      "Thank you for listening closely, sharing songs and giving these recordings a life outside the studio. That is where the next part of the story begins."
    ]
  }
];

export const getBlogs = () => POSTS;

export const getBlogsById = (id) => POSTS.find((post) => String(post.id) === String(id));

export const getRelatedBlogs = (id) => {
  const current = getBlogsById(id);
  if (!current) return [];
  return POSTS.filter((post) => post.id !== current.id)
    .sort(
      (a, b) =>
        b.tags.filter((tag) => current.tags.includes(tag)).length -
        a.tags.filter((tag) => current.tags.includes(tag)).length
    )
    .slice(0, 2);
};
