import { randomUUID } from "node:crypto";
import { withTransaction } from "./db";
import { hashPassword } from "./auth";
import { placementKeys } from "../placements";
import { getAudioSrc, videoCaptions } from "../media";
import { hashString, pad2 } from "../format";
import {
  albumPurchaseItem,
  cartKey,
  cartTotals,
  creditPack,
  creditPackItem,
  pointsFor,
  productLine,
  tierLine,
  trackPurchaseItem
} from "../pricing";
import { getArtistHomePageData, getArtistProfile } from "../../utils/getFakeArtistsData";
import { getMusics } from "../../utils/getFakeTracks";
import { buildAlbumTracks } from "../../utils/albumTracks";
import { getVideos } from "../../utils/getFakeVideos";
import { getEvents } from "../../utils/getFakeEvents";
import { CATEGORIES, getProducts } from "../../utils/getFakeProducts";
import { PHOTO_CATEGORIES, getArtistPhotos, getPhotos } from "../../utils/getFakePhotos";
import { getNews } from "../../utils/getFakeNews";
import { getBlogs } from "../../utils/getFakeBlogs";
import { getSocialPage, getSocialProfiles } from "../../utils/getFakeSocials";
import { getSeedComments } from "../../utils/getFakeComments";

// Server-only. Builds the database rows of the original demo (the utils/getFake*.js
// generators are the seed source) and resets the database to them.
//
//   buildSeedData()             { table: [row keyed by column name] } for every seeded table
//   applySeed({ scope })        replaces the data in one transaction, returns { scope, counts }
//                               "content": public content, comments, site settings
//                               "all":     content + members, their sessions, orders,
//                                          credit ledger and inbox (never admin sessions),
//                                          with a few weeks of demo activity
//   clearData({ scope })        deletes instead of reseeding (a fresh start), same scopes
//
// No filesystem access: this also runs inside the CRM's API route.

const DEMO_AVATAR =
  "https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg";
const DEMO_MEMBER = {
  username: "demo",
  email: "info@truthstudios.com",
  name: "Nick Breton",
  password: "demo1234",
  location: "Los Angeles, CA",
  credits: 3740,
  points: 21665
};
const SIGNUP_BONUS_CREDITS = 1000;

// ---------------------------------------------------------------- demo activity (scope "all")
// Times are days before the seed runs. Every balance, ledger entry and point total is
// derived from these by replaying the checkout / refund rules (see buildMembers).

const DAY = 86400e3;
const avatar = (photo) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;

// Fans (password "demo1234" too). The demo member joined first (62 days ago).
const FANS = [
  {
    username: "maya.lee",
    name: "Maya Lee",
    location: "Brooklyn, NY",
    bio: "Vinyl collector and late-night listener. Always chasing the next great bassline.",
    avatar: avatar("photo-1494790108377-be9c29b29330"),
    joined: 41.3,
    lastLogin: 0.2
  },
  {
    username: "jordan.k",
    name: "Jordan Kim",
    location: "Chicago, IL",
    bio: "Producer in progress. Here for the studio stories.",
    avatar: avatar("photo-1507003211169-0a1dd7228f2d"),
    joined: 34.6,
    lastLogin: 1.1
  },
  {
    username: "sam.rivera",
    name: "Sam Rivera",
    location: "Austin, TX",
    bio: "",
    avatar: null,
    joined: 27.2,
    lastLogin: 18.9,
    status: "suspended"
  },
  {
    username: "ava.chen",
    name: "Ava Chen",
    location: "San Francisco, CA",
    bio: "Design student. Soundtracking every all-nighter.",
    avatar: avatar("photo-1534528741775-53994a69daeb"),
    joined: 13.4,
    lastLogin: 0.6
  }
];

// Checkouts, as the lines a cart sends: { pack } credit pop-up, { product, tier?, size?,
// color? } shop, { ticket: UPCOMING, tier } events page, { album | track, tier } music.
const UPCOMING = "upcoming"; // the next event (Truth Studio Party while it's ahead)
const ORDERS = [
  {
    member: "demo",
    ago: 18.2,
    method: "card",
    lines: [{ product: "truth-studios-t-shirt", size: "L", color: "Black" }]
  },
  {
    member: "demo",
    ago: 6.1,
    method: "card",
    lines: [{ ticket: UPCOMING, tier: "General admission", qty: 2 }]
  },
  { member: "maya.lee", ago: 39.5, method: "card", lines: [{ pack: 5000 }] },
  {
    member: "maya.lee",
    ago: 30.2,
    method: "credits",
    lines: [{ product: "truth-studios-t-shirt", size: "M", color: "Black" }]
  },
  {
    member: "maya.lee",
    ago: 9.3,
    method: "credits",
    lines: [{ album: "4aW4iDepQUl5ZCHd1Gli68", tier: "download" }]
  },
  {
    member: "jordan.k",
    ago: 32.8,
    method: "card",
    lines: [{ product: "credits-2000", tier: "2,000 credits" }]
  },
  {
    member: "jordan.k",
    ago: 20.4,
    method: "credits",
    lines: [{ product: "unlimited-downloads", tier: "1 month" }]
  },
  {
    member: "jordan.k",
    ago: 2.7,
    method: "credits",
    lines: [{ track: "1BDj5lr0KVcSQpSNdyqJct-1", tier: "stream" }]
  },
  {
    member: "sam.rivera",
    ago: 25.1,
    method: "credits",
    lines: [{ album: "7ug0WdvzC2sLXTrtHUwNsj", tier: "download" }],
    refunded: 18.4
  },
  {
    member: "sam.rivera",
    ago: 21.6,
    method: "card",
    lines: [{ product: "leather-wrap-bracelet" }]
  },
  {
    member: "ava.chen",
    ago: 11.2,
    method: "card",
    lines: [{ track: "0m9hqW0RDEHPNXxhiFUGSq-1", tier: "download" }]
  },
  {
    member: "ava.chen",
    ago: 4.9,
    method: "credits",
    lines: [
      { album: "4fu0jN1IzoaXgzCfqdjOjJ", tier: "stream" },
      { track: "2W5VVBPNkGAduaArE4sX29-1", tier: "stream" }
    ]
  }
];

const MEMBER_COMMENTS = [
  {
    member: "demo",
    thread: "news:0",
    ago: 0.5,
    likes: 9,
    text: "Thanks for listening, everyone. More sessions like this one are on the way."
  },
  {
    member: "ava.chen",
    thread: "news:0",
    ago: 0.8,
    likes: 2,
    text: "Love that you kept the breaths and the finger noise in. It feels like sitting in the room."
  },
  {
    member: "maya.lee",
    thread: "album:2W5VVBPNkGAduaArE4sX29",
    ago: 1.3,
    likes: 4,
    text: "Played this on the way to work three days in a row. That chorus!"
  },
  {
    member: "jordan.k",
    thread: "album:1BDj5lr0KVcSQpSNdyqJct",
    ago: 2.5,
    likes: 1,
    text: "This one hasn't left my rotation since I found it."
  },
  {
    member: "jordan.k",
    thread: "video:daniel-caesar-welcome-to-the-nightclub",
    ago: 2.6,
    likes: 7,
    text: "The lighting in this one is unreal. Who shot it?"
  },
  {
    member: "maya.lee",
    thread: "video:kelsey-lu-the-long-way-home",
    ago: 4.2,
    likes: 3,
    text: "A forest session is exactly what I needed today."
  },
  {
    member: "ava.chen",
    thread: "album:4fu0jN1IzoaXgzCfqdjOjJ",
    ago: 4.7,
    likes: 0,
    text: "Streaming this while I study. The production is so clean."
  },
  {
    member: "maya.lee",
    thread: "news:1",
    ago: 5.4,
    likes: 2,
    text: "Would love to hear more from these new voices. Any live dates planned?"
  },
  {
    member: "maya.lee",
    thread: "album:4aW4iDepQUl5ZCHd1Gli68",
    ago: 8.9,
    likes: 5,
    text: "Grabbed the download. Worth every credit."
  },
  {
    member: "sam.rivera",
    thread: "video:daniel-caesar-welcome-to-the-nightclub",
    ago: 19.2,
    likes: 0,
    status: "hidden", // moderated spam from the suspended member
    text: "FREE CREDITS for everyone who follows my page!!! Link in my profile"
  }
];

// What the site's forms send to /api/inbox (member messages carry the member's id).
const INBOX = [
  {
    kind: "contact",
    ago: 0.3,
    status: "new",
    name: "Priya Raman",
    email: "priya.raman@example.com",
    subject: "Booking three days for an EP",
    body: "Hi! My band is tracking a five-song EP in November and we'd love to record live at Truth Studios. Is the live room free for three days in the second week of November, and can we book an engineer with it?"
  },
  {
    kind: "newsletter",
    ago: 0.9,
    status: "new",
    name: "Leo Martins",
    email: "leo.martins@example.com"
  },
  {
    kind: "feedback",
    member: "jordan.k",
    ago: 1.9,
    status: "new",
    body: "The downloads pass is great. Could I download a whole album as one zip instead of track by track?"
  },
  {
    kind: "contact",
    member: "maya.lee",
    ago: 3.2,
    status: "new",
    subject: "Vinyl pressing of Entergalactic?",
    body: "I bought the digital album and would love a physical copy too. Any chance it joins the vinyl section of the shop?"
  },
  {
    kind: "sms",
    ago: 4.6,
    status: "read",
    name: "Nate Okafor",
    payload: { phone: "(310) 555-0182" }
  },
  {
    kind: "contact",
    ago: 6.8,
    status: "read",
    name: "Marcus Hale",
    email: "marcus.hale@example.com",
    subject: "Interview request: independent studios feature",
    body: "I'm writing a feature on independent studios in Los Angeles and would love 20 minutes with Nick about Truth Studios and Projct Music. Any afternoon next week works for me."
  },
  {
    kind: "feedback",
    member: "ava.chen",
    ago: 8.5,
    status: "read",
    body: "The video pages look great on my phone. Captions on the Vine clips would be a nice touch."
  },
  {
    kind: "volunteer",
    ago: 10.4,
    status: "new",
    name: "Rosa Delgado",
    email: "rosa.delgado@example.com",
    body: "Photography student with two years of concert shooting. Happy to document sessions and help run the merch table at shows.",
    payload: { phone: "(323) 555-0119", availability: ["Evenings", "Weekends"] }
  },
  {
    kind: "newsletter",
    ago: 15.7,
    status: "read",
    name: "Hannah Brooks",
    email: "hannah.brooks@example.com"
  }
];

// Artists with a wide crop in public/home/<id>.webp.
const HOME_COVERS = new Set([
  "ady-suleiman",
  "asher-roth",
  "chronixx",
  "chuck-inglish",
  "daniel-caesar",
  "eryn-allan-kane",
  "joey-purp",
  "kelsey-lu",
  "little-simz",
  "mick-jenkins",
  "noname",
  "smino",
  "tokimonsta",
  "truth-studios",
  "vic-mensa",
  "whitney"
]);
const TAGLINE = "Independent voices. Shared inspiration.";

// The timeline every artist page showed (newest first, four days apart from Sep 22).
const TIMELINE = [
  "There is something special about hearing an idea become a record. Back in the studio, making room for the next one.",
  "A few favorite sounds have made their way into this week’s rotation. Find your next discovery in the music tab.",
  "Good people, honest music, long nights. Thanks for being part of the journey."
];
const ROTATION_SIZE = 8;

// Social feeds that show a comment thread per post (the photo feeds).
const THREAD_NETWORKS = new Set(["instagram", "pinterest"]);

// Tables in insert order (parents first). Deletes run in reverse.
const CONTENT_TABLES = [
  "artists",
  "albums",
  "tracks",
  "artist_rotation",
  "videos",
  "events",
  "event_lineup",
  "product_categories",
  "products",
  "photo_categories",
  "photos",
  "posts",
  "social_networks",
  "social_posts",
  "comments",
  "site_settings"
];
// Members come first (comments reference them), orders before their ledger entries.
const ALL_TABLES = ["users", ...CONTENT_TABLES, "orders", "credit_ledger", "inbox"];
// Members' data as [table, delete statement], children first.
const CLEAR_MEMBERS = [
  ["credit_ledger", "delete from credit_ledger"],
  ["orders", "delete from orders"],
  ["inbox", "delete from inbox"],
  ["sessions", "delete from sessions where kind = 'user'"], // never the CRM admin's sessions
  ["users", "delete from users"]
];

// ---------------------------------------------------------------- helpers

// Placement keys in catalog order; throws on a key lib/placements.js doesn't know.
function placements(entity, ...keys) {
  const known = placementKeys(entity);
  const wanted = keys.filter(Boolean);
  const unknown = wanted.filter((key) => !known.includes(key));
  if (unknown.length) throw new Error(`Unknown ${entity} placement: ${unknown.join(", ")}`);
  return known.filter((key) => wanted.includes(key));
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

// "September 22, 2026" -> "2026-09-22"
function isoDate(text) {
  const match = /^([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(String(text).trim());
  const month = match ? MONTHS.indexOf(match[1]) + 1 : 0;
  if (!month) throw new Error(`Unrecognized date: ${text}`);
  return `${match[3]}-${pad2(month)}-${pad2(match[2])}`;
}

const UNIT_MS = {
  minute: 60e3,
  hour: 3600e3,
  day: 86400e3,
  week: 7 * 86400e3,
  month: 30 * 86400e3,
  year: 365 * 86400e3
};

// "2 hours ago" -> milliseconds
function ageMs(label) {
  const match = /^(\d+) (minute|hour|day|week|month|year)s? ago$/.exec(label);
  if (!match) throw new Error(`Unrecognized comment age: ${label}`);
  return Number(match[1]) * UNIT_MS[match[2]];
}

// The generated comments CommentThread showed for a thread, dated relative to `now`.
// Seconds apart so the thread keeps its order (newest first) when labels tie.
function threadComments(threadId, now) {
  return getSeedComments(threadId).map((comment, index) => ({
    id: comment.id,
    thread_id: threadId,
    user_id: null,
    author_name: comment.author,
    author_avatar: comment.avatar || null,
    body: comment.text,
    likes: comment.likes || 0,
    status: "visible",
    created_at: new Date(now - ageMs(comment.label) - index * 1000).toISOString()
  }));
}

// A social photo's thread was seeded from its preview conversation (conversationSeed in
// components/socials/SocialFeeds.js), labelled with the post's date.
function conversationComments(post) {
  const base = Date.parse(`${post.date}T12:00:00Z`);
  return (post.conversation || []).map((reply, index) => ({
    id: `${post.id}#c${index}`,
    thread_id: `social:${post.id}`,
    user_id: null,
    author_name: reply.author,
    author_avatar: null,
    body: reply.text,
    likes: 0,
    status: "visible",
    created_at: new Date(base - index * 60e3).toISOString()
  }));
}

// ---------------------------------------------------------------- content

function buildContent(now) {
  const roster = getArtistHomePageData();
  const music = getMusics();
  const videoData = getVideos();
  const eventData = getEvents();

  // Home wall: artists with a video, in roster order (pages/index.js).
  const videoArtists = new Set(videoData.map((video) => video.artistId));
  const homeWall = new Set(
    roster
      .filter((artist) => videoArtists.has(artist.id))
      .slice(0, 12)
      .map((artist) => artist.id)
  );
  const artists = roster.map((artist, index) => {
    const profile = getArtistProfile(artist.id);
    return {
      id: artist.id,
      name: artist.name,
      location: artist.location,
      image_url: artist.imgUrl,
      cover_image_url: HOME_COVERS.has(artist.id) ? `/home/${artist.id}.webp` : null,
      tagline: TAGLINE,
      bio: profile.bio,
      followers: profile.followers,
      listeners: profile.listeners,
      sessions: profile.sessions,
      links: {},
      placements: placements(
        "artists",
        "directory",
        homeWall.has(artist.id) && "home",
        index < 10 && "top",
        index < 8 && "friends"
      ),
      sort_order: index
    };
  });

  // A release belongs to a roster artist credited on it ("Smino, J. Cole" -> smino).
  const artistByName = new Map(roster.map((artist) => [artist.name.toLowerCase(), artist.id]));
  const albums = music.map((album, index) => {
    const artistId =
      album.artist
        .split(",")
        .map((name) => artistByName.get(name.trim().toLowerCase()))
        .find(Boolean) || null;
    return {
      id: album.id,
      name: album.name,
      artist_name: album.artist,
      artist_id: artistId,
      cover_url: album.img_url,
      release_date: album.release_date,
      album_type: album.albumType,
      description: "",
      external_url: album.url || null,
      placements: placements(
        "albums",
        "music",
        index < 12 && "home",
        artistId && "artist",
        index < 16 && "socials"
      ),
      sort_order: index
    };
  });

  const tracks = music.flatMap((album) =>
    buildAlbumTracks(album).map((track) => ({
      id: track.id,
      album_id: album.id,
      number: track.number,
      title: track.title,
      artist_name: null,
      duration: track.duration,
      audio_url: getAudioSrc(track.id)
    }))
  );

  // "On rotation" picks of pages/artists/[id].js.
  const artistRotation = roster.flatMap((artist) => {
    const offset = hashString(artist.id) % music.length;
    const picks = [];
    for (let i = 0; i < ROTATION_SIZE; i++) {
      const album = music[(offset + i) % music.length];
      if (!picks.includes(album.id)) picks.push(album.id);
    }
    return picks.map((albumId, position) => ({
      artist_id: artist.id,
      album_id: albumId,
      position
    }));
  });

  const videos = videoData.map((video, index) => ({
    id: video.id,
    title: video.title,
    subtitle: video.subtitle,
    artist_id: video.artistId,
    artist_name: null,
    description: video.description,
    video_url: video.src,
    poster_url: video.poster,
    captions_url: videoCaptions(video.src),
    duration: video.duration,
    views: video.views,
    likes: video.likes,
    published_on: video.date,
    credits: video.credits,
    placements: placements("videos", "videos", "home", "artist"),
    sort_order: index
  }));

  const events = eventData.map((event, index) => ({
    id: event.id,
    title: event.title,
    subtitle: event.name,
    starts_at: event.startsAt,
    time_zone: event.timeZone,
    city: event.city,
    venue: event.address[0],
    street: event.address[1],
    locality: event.address[2],
    image_url: event.image,
    description: event.description,
    tiers: event.tiers.map(({ name, price, credits, description }) => ({
      name,
      price,
      credits,
      description
    })),
    placements: placements("events", "events", "artist"),
    sort_order: index
  }));
  const eventLineup = eventData.flatMap((event) =>
    event.lineup.map((artist, position) => ({
      event_id: event.id,
      artist_id: artist.id,
      position
    }))
  );

  const productCategories = CATEGORIES.map((category, index) => ({
    slug: category.slug,
    label: category.label,
    icon: category.icon,
    sort_order: index
  }));
  const albumArtist = new Map(albums.map((album) => [album.id, album.artist_id]));
  const products = getProducts().map((product, index) => {
    // Vinyl / CD editions belong to their album's roster artist, if any.
    const artistId = (product.albumId && albumArtist.get(product.albumId)) || null;
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      kind: product.kind,
      subtitle: product.subtitle ?? null,
      description: product.description || "",
      price: product.price ?? null,
      credits: product.credits ?? null,
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      tiers: product.tiers || [],
      grants_credits: product.grantsCredits ?? null,
      grants_downloads: Boolean(product.grantsDownloads),
      artist_id: artistId,
      album_id: product.albumId ?? null,
      event_id: product.eventId ?? null,
      added_on: product.addedAt,
      placements: placements(
        "products",
        "shop",
        product.featured && "featured",
        artistId && "artist"
      ),
      sort_order: index
    };
  });

  const photoCategories = PHOTO_CATEGORIES.map((category, index) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    image_url: category.image,
    sort_order: index
  }));
  const photo = (item, extra) => ({
    id: item.id,
    category_id: null,
    artist_id: null,
    src: item.src,
    caption: item.caption,
    location: item.location,
    alt: null,
    ...extra
  });
  const galleryPhotos = ["studio", "polaroids", "nearby"].flatMap((categoryId) =>
    getPhotos(categoryId).map((item, index) =>
      photo(item, {
        category_id: categoryId,
        placements: placements("photos", "pictures", categoryId === "polaroids" && "profile"),
        sort_order: index
      })
    )
  );
  // Per artist: the portrait (also the "Artist photos" gallery for the first 18 artists),
  // then the studio / polaroid / city shots of the artist page. sort_order keeps both the
  // gallery's roster order and each artist page's order.
  const artistPhotos = roster.flatMap((artist, artistIndex) =>
    getArtistPhotos(artist).map((item, index) =>
      index === 0
        ? photo(
            {
              id: `artist-photo-${artist.id}`,
              src: artist.imgUrl,
              caption: artist.name,
              location: artist.location
            },
            {
              category_id: "artists",
              artist_id: artist.id,
              placements: placements("photos", artistIndex < 18 && "pictures", "artist"),
              sort_order: artistIndex * 4
            }
          )
        : photo(item, {
            artist_id: artist.id,
            placements: placements("photos", "artist"),
            sort_order: artistIndex * 4 + index
          })
    )
  );

  const article = (section) => (post, index) => ({
    id: `${section}-${post.id}`,
    section,
    slug: String(post.id),
    title: post.title,
    author: post.author,
    image_url: post.imgUrl,
    snippet: post.snippet,
    category: post.category,
    tags: post.tags,
    body: post.body,
    artist_id: null,
    published_on: isoDate(post.date),
    placements: placements("posts", "listing"),
    sort_order: index
  });
  const timeline = roster.flatMap((artist) =>
    TIMELINE.map((text, index) => ({
      id: `timeline-${artist.id}-${index}`,
      section: "timeline",
      slug: `timeline-${artist.id}-${index}`,
      title: "",
      author: artist.name,
      image_url: "",
      snippet: "",
      category: "",
      tags: [],
      body: [text],
      artist_id: artist.id,
      published_on: `2026-09-${pad2(22 - index * 4)}`,
      placements: placements("posts", "artist"),
      sort_order: index
    }))
  );
  const news = getNews();
  const blogs = getBlogs();
  const posts = [...news.map(article("news")), ...blogs.map(article("blog")), ...timeline];

  const profiles = getSocialProfiles();
  const socialNetworks = profiles.map((profile, index) => ({
    id: profile.id,
    name: profile.name,
    handle: profile.handle,
    followers: profile.followers,
    url: profile.url,
    color: profile.color,
    icon: profile.icon,
    placements: placements("social_networks", "socials"),
    sort_order: index
  }));
  const socialPosts = [];
  const socialComments = [];
  for (const { id: network } of profiles) {
    for (const [index, post] of (getSocialPage(network).content.posts || []).entries()) {
      socialPosts.push(socialPostRow(network, post, index, roster));
      if (THREAD_NETWORKS.has(network)) socialComments.push(...conversationComments(post));
    }
  }

  const threads = [
    ...music.map((album) => `album:${album.id}`),
    ...videoData.map((video) => `video:${video.id}`),
    ...eventData.map((event) => `event:${event.id}`),
    ...news.map((post) => `news:${post.id}`),
    ...blogs.map((post) => `blog:${post.id}`)
  ];
  const comments = [
    ...threads.flatMap((threadId) => threadComments(threadId, now)),
    ...socialComments
  ];

  const siteSettings = [
    { key: "signup_bonus_credits", value: SIGNUP_BONUS_CREDITS },
    { key: "wikipedia_article", value: getSocialPage("wikipedia").content.article }
  ];

  return {
    artists,
    albums,
    tracks,
    artist_rotation: artistRotation,
    videos,
    events,
    event_lineup: eventLineup,
    product_categories: productCategories,
    products,
    photo_categories: photoCategories,
    photos: [...galleryPhotos, ...artistPhotos],
    posts,
    social_networks: socialNetworks,
    social_posts: socialPosts,
    comments,
    site_settings: siteSettings
  };
}

function socialPostRow(network, post, index, roster) {
  const row = {
    id: post.id,
    network_id: network,
    kind: "photo",
    title: null,
    body: post.caption || "",
    image_url: post.image || null,
    video_url: null,
    alt: post.alt || null,
    artist_id: null,
    posted_on: post.date,
    likes: post.likes || 0,
    comment_count: post.comments || 0,
    replies: 0,
    reposts: 0,
    views: 0,
    duration: null,
    board: null,
    ratio: null,
    conversation: post.conversation || [],
    sort_order: index
  };
  switch (network) {
    case "twitter":
      return {
        ...row,
        kind: "text",
        body: post.text,
        replies: post.replies,
        reposts: post.retweets
      };
    case "facebook":
      return { ...row, kind: post.image ? "photo" : "text" };
    case "tumblr":
      return { ...row, kind: post.type, title: post.title };
    case "pinterest":
      return { ...row, board: post.board, ratio: post.ratio };
    case "youtube":
    case "vimeo":
    case "vine":
      // Generated from the roster in order: post i features artist i.
      return {
        ...row,
        kind: "video",
        title: post.title,
        video_url: post.src,
        views: post.views,
        duration: post.duration,
        artist_id: roster[index].id
      };
    default:
      return row;
  }
}

// ---------------------------------------------------------------- members

// A products row as lib/server/pricing.js hands it to productLine (productShape there).
function productShape(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    subtitle: row.subtitle || "",
    price: row.price ?? null,
    credits: row.credits ?? null,
    images: row.images.length ? row.images : ["/shop/digital.svg"],
    sizes: row.sizes,
    colors: row.colors,
    tiers: row.tiers.map((tier) => ({
      ...tier,
      price: tier.price ?? null,
      credits: tier.credits ?? null,
      grantsCredits: tier.grantsCredits || 0
    })),
    grantsCredits: row.grants_credits || 0,
    grantsDownloads: row.grants_downloads
  };
}

// "October 13, 2026" in the venue's time zone (eventDate in lib/server/pricing.js).
function eventDate(event) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: event.time_zone,
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(event.starts_at));
}

// The item a real checkout records for a cart line: the same builders and fields as
// priceLines() in lib/server/pricing.js, from the seed rows instead of the database.
function checkoutItem(line, catalog) {
  const find = (map, id) => {
    if (!map.has(id)) throw new Error(`Seed order refers to a missing item: ${id}`);
    return map.get(id);
  };
  let expected;
  let asked = {};
  if (line.pack) {
    expected = creditPackItem(creditPack(line.pack));
  } else if (line.ticket) {
    const event = find(catalog.events, line.ticket);
    const tier = event.tiers.find((t) => t.name === line.tier) || event.tiers[0];
    asked = { tier: tier.name };
    expected = {
      id: `ticket:${event.id}`,
      name: event.title,
      subtitle: [eventDate(event), event.venue].filter(Boolean).join(" · "),
      image: event.image_url || "",
      kind: "ticket",
      price: tier.price,
      credits: tier.credits,
      grantsCredits: 0,
      options: { tier: tier.name },
      startsAt: new Date(event.starts_at).toISOString()
    };
  } else if (line.album) {
    const album = find(catalog.albums, line.album);
    const item = albumPurchaseItem({
      id: album.id,
      name: album.name,
      artist: album.artist_name,
      img_url: album.cover_url,
      tracks: catalog.tracksByAlbum.get(album.id)
    });
    expected = tierLine(item, line.tier);
    asked = { tier: item.tiers.find((t) => t.id === line.tier)?.label };
  } else if (line.track) {
    const track = find(catalog.tracks, line.track);
    const album = find(catalog.albums, track.album_id);
    const item = trackPurchaseItem({
      id: track.id,
      title: track.title,
      artist: track.artist_name ?? album.artist_name,
      cover: album.cover_url
    });
    expected = tierLine(item, line.tier);
    asked = { tier: item.tiers.find((t) => t.id === line.tier)?.label };
  } else {
    const product = productShape(find(catalog.products, line.product));
    const tier = line.tier ? product.tiers.find((t) => t.label === line.tier) : undefined;
    asked = { tier: line.tier, size: line.size, color: line.color };
    expected = productLine(product, { tier, size: line.size, color: line.color });
  }
  // The checkout rejects a line whose options differ from what the item offers.
  if (cartKey("", expected.options) !== cartKey("", asked)) {
    throw new Error(`Seed order line doesn't match its item: ${JSON.stringify(line)}`);
  }
  return {
    ...expected,
    grantsCredits: expected.grantsCredits || 0,
    qty: line.qty || 1,
    key: cartKey(expected.id, expected.options)
  };
}

// Ids in the format the API routes generate (makeId / newOrderId), for a past moment.
function pastId(prefix, at, seed, length) {
  const suffix = hashString(seed).toString(36).padStart(length, "0").slice(-length);
  return `${prefix}-${at.toString(36)}${suffix}`;
}

// The demo member plus the fans with their orders, credit history, comments and inbox
// messages. Balances replay the rules of /api/auth/signup, /api/checkout and the CRM
// refund, so every ledger chain adds up to the member's credits.
async function buildMembers(content, now) {
  const at = (daysAgo) => now - daysAgo * DAY;
  const iso = (time) => new Date(time).toISOString();
  const tracksByAlbum = new Map(content.albums.map((album) => [album.id, []]));
  for (const track of content.tracks) {
    tracksByAlbum.get(track.album_id).push({ id: track.id, title: track.title });
  }
  const catalog = {
    products: new Map(content.products.map((row) => [row.id, row])),
    events: new Map(content.events.map((row) => [row.id, row])),
    albums: new Map(content.albums.map((row) => [row.id, row])),
    tracks: new Map(content.tracks.map((row) => [row.id, row])),
    tracksByAlbum
  };
  // Tickets are for an event still ahead (the last one once every date has passed,
  // bought a week before it).
  const upcoming = content.events.filter((event) => Date.parse(event.starts_at) > now);
  const ticketEvent =
    upcoming.find((event) => event.id === "truth-studio-party") ||
    upcoming[0] ||
    content.events[content.events.length - 1];

  const people = [
    {
      ...DEMO_MEMBER,
      avatar: DEMO_AVATAR,
      bio: "",
      joined: 62,
      lastLogin: 0.1,
      isDemo: true
    },
    ...FANS.map((fan) => ({ ...fan, email: `${fan.username}@example.com`, password: "demo1234" }))
  ];
  const hashes = await Promise.all(people.map((person) => hashPassword(person.password)));
  const members = new Map(
    people.map((person, index) => [
      person.username,
      {
        person,
        row: {
          id: randomUUID(),
          username: person.username,
          email: person.email,
          name: person.name,
          password_hash: hashes[index],
          avatar_url: person.avatar,
          location: person.location,
          bio: person.bio,
          credits: 0,
          points: 0,
          status: person.status || "active",
          is_demo: Boolean(person.isDemo),
          created_at: iso(at(person.joined)),
          last_login_at: iso(at(person.lastLogin))
        }
      }
    ])
  );
  const member = (username) => members.get(username).row;

  // Everything that moves credits or points, replayed in time order per member.
  const ledger = [];
  const credit = (user, time, delta, reason, orderId, note) => {
    user.credits += delta;
    if (user.credits < 0) throw new Error(`Seed activity overdraws ${user.username}`);
    ledger.push({
      user_id: user.id,
      delta,
      balance_after: user.credits,
      reason,
      order_id: orderId,
      note,
      created_at: iso(time)
    });
  };
  const events = [];
  for (const { person, row } of members.values()) {
    const [delta, reason, note] = person.isDemo
      ? [person.credits, "seed", "Demo balance"]
      : [SIGNUP_BONUS_CREDITS, "signup_bonus", "Welcome bonus"];
    const time = at(person.joined);
    events.push({ time, run: () => credit(row, time, delta, reason, null, note) });
  }
  const orders = ORDERS.map((spec, index) => {
    const user = member(spec.member);
    const lines = spec.lines.map((line) =>
      line.ticket === UPCOMING ? { ...line, ticket: ticketEvent.id } : line
    );
    const items = lines.map((line) => checkoutItem(line, catalog));
    const ticketStart = Math.min(
      ...items.filter((item) => item.startsAt).map((item) => Date.parse(item.startsAt))
    );
    const time = Math.min(at(spec.ago), ticketStart - 7 * DAY);
    const unpayable = items.find((item) =>
      spec.method === "credits" ? item.credits == null : item.price == null
    );
    if (unpayable) throw new Error(`Seed order can't pay ${unpayable.name} by ${spec.method}`);
    const totals = cartTotals(items);
    const order = {
      id: pastId("PM", time, `order:${index}`, 4).toUpperCase(),
      user_id: user.id,
      method: spec.method,
      items,
      total_usd: spec.method === "card" ? totals.cents / 100 : 0,
      total_credits: spec.method === "credits" ? totals.credits : 0,
      credits_granted: items.reduce((sum, item) => sum + item.grantsCredits * item.qty, 0),
      points_earned: pointsFor(spec.method, totals),
      status: spec.refunded ? "refunded" : "completed",
      created_at: iso(time)
    };
    events.push({
      time,
      run: () => {
        if (order.total_credits) {
          credit(user, time, -order.total_credits, "order", order.id, `Order ${order.id}`);
        }
        if (order.credits_granted) {
          const note = `Credit pack, order ${order.id}`;
          credit(user, time, order.credits_granted, "credit_pack", order.id, note);
        }
        user.points += order.points_earned;
      }
    });
    if (spec.refunded) {
      const refundTime = at(spec.refunded);
      events.push({
        time: refundTime,
        run: () => {
          if (order.total_credits) {
            const note = "Refund: credits returned";
            credit(user, refundTime, order.total_credits, "refund", order.id, note);
          }
          if (order.credits_granted) {
            const note = "Refund: granted credits removed";
            credit(user, refundTime, -order.credits_granted, "refund", order.id, note);
          }
          user.points = Math.max(user.points - order.points_earned, 0);
        }
      });
    }
    return order;
  });
  events.sort((a, b) => a.time - b.time);
  for (const event of events) event.run();
  // The demo account keeps its documented points (its card orders are part of them).
  const demo = member(DEMO_MEMBER.username);
  demo.points = DEMO_MEMBER.points;
  if (demo.credits !== DEMO_MEMBER.credits) throw new Error("Seed activity changed demo credits");

  const comments = MEMBER_COMMENTS.map((comment) => {
    const user = member(comment.member);
    const time = at(comment.ago);
    return {
      id: pastId("comment", time, `${comment.member}:${comment.thread}`, 6),
      thread_id: comment.thread,
      user_id: user.id,
      author_name: user.name,
      author_avatar: user.avatar_url,
      body: comment.text,
      likes: comment.likes,
      status: comment.status || "visible",
      created_at: iso(time)
    };
  });

  const inbox = INBOX.map((message, index) => {
    const user = message.member ? member(message.member) : null;
    const time = at(message.ago);
    return {
      id: pastId(message.kind, time, `inbox:${index}`, 6),
      kind: message.kind,
      user_id: user?.id ?? null,
      name: message.name ?? user?.name ?? null,
      email: message.email ?? user?.email ?? null,
      subject: message.subject ?? null,
      body: message.body ?? null,
      payload: message.payload ?? {},
      status: message.status,
      created_at: iso(time)
    };
  });

  return {
    users: [...members.values()].map(({ row }) => row),
    orders: orders.sort((a, b) => a.created_at.localeCompare(b.created_at)),
    credit_ledger: ledger,
    inbox,
    comments
  };
}

// ---------------------------------------------------------------- public API

// Everything scope "all" writes (member comments are added to the content's comments).
export async function buildSeedData({ now = Date.now() } = {}) {
  const content = buildContent(Number(now));
  const members = await buildMembers(content, Number(now));
  return { ...content, ...members, comments: [...content.comments, ...members.comments] };
}

// One statement per table: the rows travel as a single JSON parameter and are typed by
// the table's row type. Only the listed columns are written, the rest get their DEFAULT.
async function insertRows(client, table, rows) {
  if (!rows.length) return 0;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const list = columns.map((column) => `"${column}"`).join(", ");
  const { rowCount } = await client.query(
    `insert into "${table}" (${list}) select ${list} from jsonb_populate_recordset(null::"${table}", $1::jsonb)`,
    [JSON.stringify(rows)]
  );
  return rowCount;
}

// Content tables as [table, delete statement], children first.
const contentDeletes = (tables) =>
  [...tables].reverse().map((table) => [table, `delete from ${table}`]);

// Runs the deletes in one round trip (simple query protocol) after taking the lock that
// makes overlapping resets / clears (a double-clicked button) run one after the other.
// Resolves to { table: rows deleted }.
async function deleteRows(client, statements) {
  const lock = "select pg_advisory_xact_lock(hashtext('projct-music:seed'))";
  const results = await client.query([lock, ...statements.map(([, text]) => text)].join(";\n"));
  return Object.fromEntries(
    statements.map(([table], index) => [table, results[index + 1].rowCount])
  );
}

const logAction = (client, action, detail) =>
  client.query(
    "insert into audit_log (actor, action, entity, detail) values ('system', $1, 'database', $2::jsonb)",
    [action, JSON.stringify(detail)]
  );

export async function applySeed({ scope = "content" } = {}) {
  if (scope !== "content" && scope !== "all") throw new Error(`Unknown seed scope: ${scope}`);
  const tables = scope === "all" ? ALL_TABLES : CONTENT_TABLES;
  const data = scope === "all" ? await buildSeedData() : buildContent(Date.now());
  const deletes = [...contentDeletes(CONTENT_TABLES), ...(scope === "all" ? CLEAR_MEMBERS : [])];
  return withTransaction(async (client) => {
    await deleteRows(client, deletes);
    const counts = {};
    for (const table of tables) counts[table] = await insertRows(client, table, data[table]);
    await logAction(client, "reset", { scope, counts });
    return { scope, counts };
  });
}

// Empties the database for a fresh start (the CRM's "Clear all data").
//   "content": all public content and comments; site_settings stay (configuration),
//              members, orders and inbox stay
//   "all":     content + every member (the demo account too), member sessions (never
//              the admin's), orders, credit ledger, inbox and rate limits
// Resolves to { scope, counts } with the rows deleted per table.
export async function clearData({ scope = "content" } = {}) {
  if (scope !== "content" && scope !== "all") throw new Error(`Unknown clear scope: ${scope}`);
  const deletes = [
    ...contentDeletes(CONTENT_TABLES.filter((table) => table !== "site_settings")),
    ...(scope === "all" ? [...CLEAR_MEMBERS, ["rate_limits", "delete from rate_limits"]] : [])
  ];
  return withTransaction(async (client) => {
    const counts = await deleteRows(client, deletes);
    await logAction(client, "clear", { scope, counts });
    return { scope, counts };
  });
}
