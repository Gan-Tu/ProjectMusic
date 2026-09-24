// Where each kind of content can appear on the public site. A row's `placements`
// column holds the keys of the surfaces it's listed on; `status = 'draft'` hides it
// everywhere. Shared by the CRM (toggles) and the public content queries.

export const PLACEMENTS = {
  artists: [
    { key: "directory", label: "Artists tab", hint: "A–Z artist directory (/artists)" },
    { key: "home", label: "Home", hint: "Artist wall on the home page" },
    { key: "top", label: "Top artists", hint: "Sidebar on artist and profile pages" },
    { key: "friends", label: "Socials", hint: "Friends list on the Myspace page" }
  ],
  albums: [
    { key: "music", label: "Music tab", hint: "Track list and album catalog" },
    { key: "home", label: "Home", hint: "New releases on the home page" },
    { key: "artist", label: "Artist page", hint: "Discography on the linked artist's page" },
    { key: "socials", label: "Socials", hint: "SoundCloud and Myspace players" }
  ],
  videos: [
    { key: "videos", label: "Videos tab", hint: "Video stage and carousel (/videos)" },
    { key: "home", label: "Home", hint: "Hero, featured videos and video strip" },
    { key: "artist", label: "Artist page", hint: "Videos tab on the linked artist's page" }
  ],
  events: [
    { key: "events", label: "Events tab", hint: "Upcoming events calendar (/events)" },
    { key: "artist", label: "Artist pages", hint: "Events tab of each artist in the line-up" }
  ],
  products: [
    { key: "shop", label: "Shop", hint: "Listed in its shop category" },
    { key: "featured", label: "Featured", hint: "Featured row on the shop home" },
    { key: "artist", label: "Artist page", hint: "Merch tab on the linked artist's page" }
  ],
  photos: [
    { key: "pictures", label: "Pictures tab", hint: "Gallery of the photo's category" },
    { key: "artist", label: "Artist page", hint: "Pictures tab on the linked artist's page" },
    { key: "profile", label: "Profile", hint: "Photo strip on member profile pages" }
  ],
  posts: [
    { key: "listing", label: "News / Blog", hint: "Listed on its section's page" },
    { key: "artist", label: "Artist page", hint: "Timeline on the linked artist's page" }
  ],
  social_networks: [{ key: "socials", label: "Socials tab", hint: "Network hub (/socials)" }]
};

export function placementKeys(entity) {
  return (PLACEMENTS[entity] || []).map((placement) => placement.key);
}

// Keeps only known keys, in catalog order.
export function normalizePlacements(entity, keys) {
  const wanted = new Set(Array.isArray(keys) ? keys : []);
  return placementKeys(entity).filter((key) => wanted.has(key));
}
