// CRM entity definitions (client-safe, pure data). The admin UI renders forms and lists
// from these, and lib/server/crm/registry.js adds the SQL details (search, sorting,
// filters, relations) for the generic engine.
//
// Field types: text, textarea, slug, image, audio, video, link (URL inputs; the media
// ones get a live preview), int, duration (seconds, edited as mm:ss), money, bool, date,
// datetime (timestamptz, shown in `tzField`'s zone), timezone, enum, ref (FK select),
// tags / images / paragraphs (text[]), list (jsonb array of objects), map (jsonb object),
// json, placements, status, color. `readonly` fields are shown but never written;
// `createOnly` fields (ids) can only be set when creating; `side` puts a field in the
// right-hand "Publishing" column; `width` is "half" | "third" (default full).

const CONTENT_STATUSES = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" }
];

const opts = (...values) => values.map((value) => ({ value, label: value }));

const publishing = (withPlacements = true) => [
  { name: "status", label: "Status", type: "status", side: true },
  ...(withPlacements
    ? [{ name: "placements", label: "Show on", type: "placements", side: true }]
    : []),
  {
    name: "sort_order",
    label: "Sort order",
    type: "int",
    side: true,
    help: "Lower numbers are listed first."
  }
];

const slugField = (help) => ({
  name: "id",
  label: "Slug (URL id)",
  type: "slug",
  createOnly: true,
  help: help || "Leave empty to generate it from the name. Can't be changed later."
});

export const ENTITIES = {
  artists: {
    table: "artists",
    label: "Artist",
    plural: "Artists",
    section: "artists",
    idFrom: "name",
    titleField: "name",
    subtitleField: "location",
    thumbField: "image_url",
    statuses: CONTENT_STATUSES,
    placements: "artists",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Name A–Z" },
      { key: "newest", label: "Newest" },
      { key: "updated", label: "Recently updated" }
    ],
    publicPath: (row) => `/artists/${row.id}`,
    fields: [
      slugField(),
      { name: "name", label: "Name", type: "text", required: true, max: 120, width: "half" },
      { name: "location", label: "Location", type: "text", max: 120, width: "half" },
      { name: "tagline", label: "Tagline", type: "text", max: 240 },
      { name: "bio", label: "Bio", type: "textarea", max: 20000, rows: 8 },
      { name: "image_url", label: "Portrait image URL (square)", type: "image" },
      { name: "cover_image_url", label: "Cover image URL (wide)", type: "image", nullable: true },
      { name: "followers", label: "Followers", type: "int", min: 0, width: "third" },
      { name: "listeners", label: "Listeners", type: "int", min: 0, width: "third" },
      { name: "sessions", label: "Sessions", type: "int", min: 0, width: "third" },
      {
        name: "links",
        label: "Links",
        type: "map",
        keys: ["website", "instagram", "youtube", "twitter", "facebook", "spotify", "soundcloud"],
        help: "Profile links shown on the artist's About tab."
      },
      ...publishing()
    ]
  },

  albums: {
    table: "albums",
    label: "Album",
    plural: "Albums",
    section: "music",
    idFrom: "name",
    titleField: "name",
    subtitleField: "artist_name",
    thumbField: "cover_url",
    statuses: CONTENT_STATUSES,
    placements: "albums",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "newest", label: "Newest release" },
      { key: "name", label: "Name A–Z" },
      { key: "updated", label: "Recently updated" }
    ],
    filters: [
      { key: "artist", label: "Artist", ref: "artists" },
      { key: "album_type", label: "Type", options: opts("album", "single", "ep", "compilation") }
    ],
    publicPath: (row) => `/albums/${row.id}`,
    fields: [
      slugField(),
      { name: "name", label: "Title", type: "text", required: true, max: 200 },
      {
        name: "artist_id",
        label: "Roster artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "half",
        help: "Links the release to an artist page."
      },
      {
        name: "artist_name",
        label: "Credited artist (display)",
        type: "text",
        max: 200,
        width: "half",
        placeholder: "Various Artists"
      },
      {
        name: "album_type",
        label: "Type",
        type: "enum",
        options: opts("album", "single", "ep", "compilation"),
        width: "half"
      },
      { name: "release_date", label: "Release date", type: "date", nullable: true, width: "half" },
      { name: "cover_url", label: "Cover image URL", type: "image" },
      { name: "description", label: "Description", type: "textarea", max: 10000 },
      { name: "external_url", label: "External link (e.g. Spotify)", type: "link", nullable: true },
      ...publishing()
    ]
  },

  tracks: {
    table: "tracks",
    label: "Track",
    plural: "Tracks",
    hidden: true,
    titleField: "title",
    statuses: CONTENT_STATUSES,
    stamps: ["created_at", "updated_at"],
    fields: [
      { name: "id", label: "Id", type: "slug", createOnly: true },
      { name: "album_id", label: "Album", type: "ref", ref: "albums", required: true },
      { name: "number", label: "No.", type: "int", min: 1 },
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "artist_name", label: "Artist override", type: "text", max: 200, nullable: true },
      { name: "duration", label: "Duration", type: "duration" },
      { name: "audio_url", label: "Audio URL", type: "audio" },
      { name: "status", label: "Status", type: "status" }
    ]
  },

  videos: {
    table: "videos",
    label: "Video",
    plural: "Videos",
    section: "videos",
    idFrom: "title",
    titleField: "title",
    subtitleField: "subtitle",
    thumbField: "poster_url",
    thumbShape: "wide",
    statuses: CONTENT_STATUSES,
    placements: "videos",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "newest", label: "Newest" },
      { key: "views", label: "Most viewed" },
      { key: "name", label: "Title A–Z" }
    ],
    filters: [{ key: "artist", label: "Artist", ref: "artists" }],
    publicPath: (row) => `/videos/${row.id}`,
    fields: [
      slugField(),
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "subtitle", label: "Subtitle", type: "text", max: 200 },
      {
        name: "artist_id",
        label: "Roster artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "half"
      },
      {
        name: "artist_name",
        label: "Display artist (override)",
        type: "text",
        max: 200,
        nullable: true,
        width: "half"
      },
      {
        name: "video_url",
        label: "Video URL",
        type: "video",
        help: "A YouTube or Vimeo link, or a direct .mp4 / .webm file."
      },
      { name: "poster_url", label: "Poster image URL", type: "image" },
      {
        name: "captions_url",
        label: "Captions URL (.vtt)",
        type: "link",
        nullable: true,
        help: "WebVTT captions, used for video files only."
      },
      { name: "duration", label: "Duration", type: "duration", width: "third" },
      { name: "views", label: "Views", type: "int", min: 0, width: "third" },
      { name: "likes", label: "Likes", type: "int", min: 0, width: "third" },
      { name: "published_on", label: "Published on", type: "date", width: "half" },
      { name: "description", label: "Description", type: "textarea", max: 10000 },
      {
        name: "credits",
        label: "Credits",
        type: "list",
        columns: [
          { key: "role", label: "Role", placeholder: "Director" },
          { key: "name", label: "Name", placeholder: "Jane Doe" }
        ]
      },
      ...publishing()
    ]
  },

  events: {
    table: "events",
    label: "Event",
    plural: "Events",
    section: "events",
    idFrom: "title",
    titleField: "title",
    subtitleField: "subtitle",
    thumbField: "image_url",
    thumbShape: "wide",
    statuses: CONTENT_STATUSES,
    placements: "events",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "upcoming", label: "Date (soonest)" },
      { key: "latest", label: "Date (latest)" },
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Title A–Z" }
    ],
    filters: [{ key: "artist", label: "Line-up artist", ref: "artists" }],
    publicPath: (row) => `/events/${row.id}`,
    fields: [
      slugField(),
      { name: "title", label: "Title", type: "text", required: true, max: 200 },
      { name: "subtitle", label: "Subtitle", type: "text", max: 200 },
      {
        name: "starts_at",
        label: "Starts at (venue time)",
        type: "datetime",
        tzField: "time_zone",
        required: true,
        width: "half"
      },
      { name: "time_zone", label: "Venue time zone", type: "timezone", width: "half" },
      { name: "venue", label: "Venue", type: "text", max: 200, width: "half" },
      { name: "city", label: "City", type: "text", max: 120, width: "half" },
      { name: "street", label: "Street", type: "text", max: 200, width: "half" },
      {
        name: "locality",
        label: "Locality",
        type: "text",
        max: 200,
        width: "half",
        placeholder: "Hollywood, CA 90068"
      },
      { name: "image_url", label: "Image URL", type: "image" },
      { name: "description", label: "Description", type: "textarea", max: 10000 },
      {
        name: "tiers",
        label: "Ticket tiers",
        type: "list",
        columns: [
          { key: "name", label: "Name", placeholder: "General admission" },
          { key: "price", label: "Price (USD)", type: "money" },
          { key: "credits", label: "Credits", type: "int" },
          { key: "description", label: "Description", placeholder: "One admission" }
        ]
      },
      ...publishing()
    ]
  },

  product_categories: {
    table: "product_categories",
    pk: "slug",
    label: "Shop category",
    plural: "Shop categories",
    section: "shop-categories",
    idFrom: "label",
    titleField: "label",
    subtitleField: "slug",
    statuses: CONTENT_STATUSES,
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Label A–Z" }
    ],
    publicPath: (row) => `/shop?category=${row.slug}`,
    fields: [
      {
        name: "slug",
        label: "Slug",
        type: "slug",
        createOnly: true,
        help: "Leave empty to generate it from the label."
      },
      { name: "label", label: "Label", type: "text", required: true, max: 80 },
      {
        name: "icon",
        label: "Icon",
        type: "enum",
        options: opts(
          "bag",
          "coins",
          "pencil",
          "crown",
          "shirt",
          "cap",
          "disc",
          "record",
          "download",
          "ticket",
          "sparkles",
          "star"
        )
      },
      ...publishing(false)
    ]
  },

  products: {
    table: "products",
    label: "Product",
    plural: "Products",
    section: "shop",
    idFrom: "name",
    titleField: "name",
    subtitleField: "category",
    thumbField: "images",
    statuses: CONTENT_STATUSES,
    placements: "products",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "newest", label: "Newest" },
      { key: "name", label: "Name A–Z" },
      { key: "price", label: "Price" }
    ],
    filters: [
      { key: "category", label: "Category", ref: "product_categories" },
      { key: "kind", label: "Kind", options: opts("merch", "digital", "ticket") },
      { key: "artist", label: "Artist", ref: "artists" }
    ],
    publicPath: (row) => `/shop/${row.id}`,
    fields: [
      slugField(),
      { name: "name", label: "Name", type: "text", required: true, max: 200 },
      {
        name: "category",
        label: "Category",
        type: "ref",
        ref: "product_categories",
        required: true,
        width: "half"
      },
      {
        name: "kind",
        label: "Kind",
        type: "enum",
        options: opts("merch", "digital", "ticket"),
        width: "half"
      },
      { name: "subtitle", label: "Subtitle", type: "text", max: 200, nullable: true },
      { name: "description", label: "Description", type: "textarea", max: 10000 },
      {
        name: "price",
        label: "Price (USD)",
        type: "money",
        nullable: true,
        width: "half",
        help: "Empty = credits only."
      },
      {
        name: "credits",
        label: "Price in credits",
        type: "int",
        min: 0,
        nullable: true,
        width: "half",
        help: "Empty = card only."
      },
      { name: "images", label: "Images", type: "images" },
      { name: "sizes", label: "Sizes", type: "tags", width: "half", placeholder: "S, M, L…" },
      { name: "colors", label: "Colors", type: "tags", width: "half", placeholder: "Black…" },
      {
        name: "tiers",
        label: "Tiers / options",
        type: "list",
        columns: [
          { key: "id", label: "Id", placeholder: "1-year" },
          { key: "label", label: "Label", placeholder: "1 year" },
          { key: "price", label: "Price", type: "money" },
          { key: "credits", label: "Credits", type: "int" },
          { key: "grantsCredits", label: "Grants credits", type: "int" }
        ]
      },
      {
        name: "grants_credits",
        label: "Grants credits (credit pack)",
        type: "int",
        min: 1,
        nullable: true,
        width: "half"
      },
      {
        name: "grants_downloads",
        label: "Grants downloads (download pass)",
        type: "bool",
        width: "half"
      },
      {
        name: "artist_id",
        label: "Artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "third"
      },
      {
        name: "album_id",
        label: "Album (vinyl / CD)",
        type: "ref",
        ref: "albums",
        nullable: true,
        width: "third"
      },
      {
        name: "event_id",
        label: "Event (tickets)",
        type: "ref",
        ref: "events",
        nullable: true,
        width: "third"
      },
      { name: "added_on", label: "Added on", type: "date", width: "half" },
      ...publishing()
    ]
  },

  photo_categories: {
    table: "photo_categories",
    label: "Photo category",
    plural: "Photo categories",
    section: "photo-categories",
    idFrom: "name",
    titleField: "name",
    subtitleField: "description",
    thumbField: "image_url",
    statuses: CONTENT_STATUSES,
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Name A–Z" }
    ],
    publicPath: (row) => `/pictures/${row.id}`,
    fields: [
      slugField(),
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "description", label: "Description", type: "textarea", max: 2000, rows: 3 },
      { name: "image_url", label: "Cover image URL", type: "image" },
      ...publishing(false)
    ]
  },

  photos: {
    table: "photos",
    label: "Photo",
    plural: "Photos",
    section: "pictures",
    idFrom: "caption",
    idFallback: "photo",
    titleField: "caption",
    subtitleField: "location",
    thumbField: "src",
    statuses: CONTENT_STATUSES,
    placements: "photos",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "newest", label: "Newest" }
    ],
    filters: [
      { key: "category", label: "Category", ref: "photo_categories" },
      { key: "artist", label: "Artist", ref: "artists" }
    ],
    publicPath: (row) => (row.category_id ? `/pictures/${row.category_id}` : "/pictures"),
    fields: [
      slugField("Leave empty to generate it from the caption."),
      { name: "src", label: "Image URL", type: "image", required: true },
      { name: "caption", label: "Caption", type: "text", max: 300 },
      { name: "location", label: "Location", type: "text", max: 200, width: "half" },
      { name: "alt", label: "Alt text", type: "text", max: 300, nullable: true, width: "half" },
      {
        name: "category_id",
        label: "Category",
        type: "ref",
        ref: "photo_categories",
        nullable: true,
        width: "half"
      },
      {
        name: "artist_id",
        label: "Artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "half"
      },
      ...publishing()
    ]
  },

  posts: {
    table: "posts",
    label: "Post",
    plural: "Posts",
    section: "posts",
    titleField: "title",
    subtitleField: "section",
    thumbField: "image_url",
    statuses: CONTENT_STATUSES,
    placements: "posts",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "newest", label: "Newest" },
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Title A–Z" }
    ],
    filters: [
      { key: "section", label: "Section", options: opts("news", "blog", "timeline") },
      { key: "artist", label: "Artist", ref: "artists" }
    ],
    publicPath: (row) =>
      row.section === "timeline"
        ? row.artist_id
          ? `/artists/${row.artist_id}`
          : null
        : `/${row.section}/${row.slug}`,
    fields: [
      slugField("Internal id. Leave empty to generate it from the section and slug."),
      {
        name: "section",
        label: "Section",
        type: "enum",
        options: opts("news", "blog", "timeline"),
        required: true,
        width: "half",
        help: "Moving between news and blog keeps the comments; timeline posts have none."
      },
      {
        name: "slug",
        label: "Slug (URL id)",
        type: "slug",
        width: "half",
        help: "Empty = generated from the title. Comments follow a changed slug."
      },
      {
        name: "title",
        label: "Title",
        type: "text",
        max: 300,
        help: "Required for news and blog posts; optional on the timeline."
      },
      { name: "author", label: "Author", type: "text", max: 120, width: "half" },
      { name: "published_on", label: "Date", type: "date", width: "half" },
      { name: "category", label: "Category", type: "text", max: 120, width: "half" },
      {
        name: "artist_id",
        label: "Artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "half",
        help: "Timeline posts belong to an artist."
      },
      { name: "image_url", label: "Image URL", type: "image" },
      { name: "snippet", label: "Snippet", type: "textarea", max: 2000, rows: 3 },
      { name: "body", label: "Body paragraphs", type: "paragraphs" },
      { name: "tags", label: "Tags", type: "tags" },
      ...publishing()
    ]
  },

  social_networks: {
    table: "social_networks",
    label: "Social network",
    plural: "Social networks",
    section: "socials",
    idFrom: "name",
    titleField: "name",
    subtitleField: "handle",
    statuses: CONTENT_STATUSES,
    placements: "social_networks",
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "name", label: "Name A–Z" },
      { key: "followers", label: "Followers" }
    ],
    publicPath: (row) => `/socials/${row.id}`,
    fields: [
      slugField("The network key, e.g. instagram. Used in /socials/<slug>."),
      { name: "name", label: "Name", type: "text", required: true, max: 80, width: "half" },
      { name: "handle", label: "Handle", type: "text", max: 120, width: "half" },
      { name: "url", label: "Profile URL", type: "link" },
      { name: "followers", label: "Followers", type: "int", min: 0, width: "third" },
      { name: "color", label: "Brand color", type: "color", width: "third" },
      {
        name: "icon",
        label: "Icon",
        type: "text",
        max: 60,
        width: "third",
        placeholder: "faInstagram",
        help: "Font Awesome brand icon name."
      },
      ...publishing()
    ]
  },

  social_posts: {
    table: "social_posts",
    label: "Social post",
    plural: "Social posts",
    section: "social-posts",
    idFrom: "title",
    idFallback: "post",
    titleField: "title",
    subtitleField: "network_id",
    thumbField: "image_url",
    statuses: CONTENT_STATUSES,
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "manual", label: "Manual order" },
      { key: "newest", label: "Newest" }
    ],
    filters: [
      { key: "network", label: "Network", ref: "social_networks" },
      { key: "artist", label: "Artist", ref: "artists" }
    ],
    publicPath: (row) => `/socials/${row.network_id}`,
    fields: [
      slugField("Leave empty to generate one."),
      {
        name: "network_id",
        label: "Network",
        type: "ref",
        ref: "social_networks",
        required: true,
        width: "half"
      },
      {
        name: "kind",
        label: "Kind",
        type: "enum",
        options: opts("photo", "text", "quote", "video"),
        width: "half"
      },
      { name: "title", label: "Title", type: "text", max: 300, nullable: true },
      { name: "body", label: "Text / caption", type: "textarea", max: 5000, rows: 4 },
      { name: "image_url", label: "Image URL", type: "image", nullable: true },
      { name: "video_url", label: "Video URL", type: "video", nullable: true },
      { name: "alt", label: "Alt text", type: "text", max: 300, nullable: true },
      {
        name: "artist_id",
        label: "Artist",
        type: "ref",
        ref: "artists",
        nullable: true,
        width: "half"
      },
      { name: "posted_on", label: "Posted on", type: "date", width: "half" },
      { name: "likes", label: "Likes", type: "int", min: 0, width: "third" },
      { name: "comment_count", label: "Comments", type: "int", min: 0, width: "third" },
      { name: "views", label: "Views", type: "int", min: 0, width: "third" },
      { name: "replies", label: "Replies", type: "int", min: 0, width: "third" },
      { name: "reposts", label: "Reposts", type: "int", min: 0, width: "third" },
      {
        name: "duration",
        label: "Duration",
        type: "text",
        max: 20,
        nullable: true,
        width: "third"
      },
      {
        name: "board",
        label: "Pinterest board",
        type: "text",
        max: 120,
        nullable: true,
        width: "half"
      },
      {
        name: "ratio",
        label: "Aspect ratio",
        type: "text",
        max: 20,
        nullable: true,
        width: "half",
        placeholder: "3 / 4"
      },
      {
        name: "conversation",
        label: "Preview replies",
        type: "list",
        columns: [
          { key: "author", label: "Author" },
          { key: "text", label: "Text" }
        ]
      },
      ...publishing(false)
    ]
  },

  comments: {
    table: "comments",
    label: "Comment",
    plural: "Comments",
    section: "comments",
    titleField: "body",
    subtitleField: "author_name",
    thumbField: "author_avatar",
    thumbShape: "round",
    canCreate: false,
    statuses: [
      { value: "visible", label: "Visible" },
      { value: "hidden", label: "Hidden" }
    ],
    stamps: ["created_at"],
    sorts: [
      { key: "newest", label: "Newest" },
      { key: "oldest", label: "Oldest" },
      { key: "likes", label: "Most liked" }
    ],
    filters: [
      {
        key: "kind",
        label: "Thread",
        options: opts("album", "video", "event", "news", "blog", "social")
      },
      { key: "artist", label: "Artist", ref: "artists" }
    ],
    publicPath: (row) => threadPath(row.thread_id, row.thread_network),
    fields: [
      { name: "thread_label", label: "Thread", type: "text", readonly: true, virtual: true },
      { name: "thread_id", label: "Thread id", type: "text", readonly: true, width: "half" },
      { name: "author_name", label: "Author name", type: "text", required: true, max: 120 },
      { name: "author_avatar", label: "Author avatar URL", type: "image", nullable: true },
      { name: "body", label: "Comment", type: "textarea", required: true, max: 5000, rows: 5 },
      { name: "likes", label: "Likes", type: "int", min: 0, width: "half" },
      { name: "user_id", label: "Member id", type: "text", readonly: true, width: "half" },
      { name: "edited_at", label: "Edited", type: "datetime", readonly: true, width: "half" },
      { name: "status", label: "Status", type: "status", side: true }
    ]
  },

  members: {
    table: "users",
    label: "Member",
    plural: "Members",
    section: "members",
    uuid: true,
    canCreate: false,
    titleField: "name",
    subtitleField: "username",
    thumbField: "avatar_url",
    thumbShape: "round",
    statuses: [
      { value: "active", label: "Active" },
      { value: "suspended", label: "Suspended" }
    ],
    stamps: ["created_at", "updated_at"],
    sorts: [
      { key: "newest", label: "Newest" },
      { key: "name", label: "Name A–Z" },
      { key: "credits", label: "Most credits" },
      { key: "login", label: "Last login" }
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120, width: "half" },
      { name: "username", label: "Username", type: "text", required: true, max: 40, width: "half" },
      { name: "email", label: "Email", type: "text", required: true, max: 200 },
      {
        name: "avatar_url",
        label: "Avatar URL",
        type: "image",
        nullable: true,
        avatar: true,
        help: "An https:// image URL. Photos members upload themselves are kept as-is."
      },
      { name: "location", label: "Location", type: "text", max: 120, width: "half" },
      { name: "points", label: "Points", type: "int", min: 0, width: "half" },
      { name: "bio", label: "Bio", type: "textarea", max: 2000, rows: 3 },
      { name: "credits", label: "Credits", type: "int", readonly: true, width: "third" },
      { name: "is_demo", label: "Demo account", type: "bool", readonly: true, width: "third" },
      {
        name: "last_login_at",
        label: "Last login",
        type: "datetime",
        readonly: true,
        width: "third"
      },
      { name: "status", label: "Status", type: "status", side: true }
    ]
  },

  orders: {
    table: "orders",
    label: "Order",
    plural: "Orders",
    section: "orders",
    canCreate: false,
    readonlyEntity: true,
    titleField: "id",
    subtitleField: "method",
    statuses: [
      { value: "completed", label: "Completed" },
      { value: "refunded", label: "Refunded" },
      { value: "cancelled", label: "Cancelled" }
    ],
    stamps: ["created_at"],
    sorts: [
      { key: "newest", label: "Newest" },
      { key: "oldest", label: "Oldest" },
      { key: "total", label: "Highest total" }
    ],
    filters: [
      { key: "method", label: "Paid with", options: opts("credits", "card") },
      { key: "member", label: "Member id" }
    ],
    fields: [
      { name: "user_id", label: "Member id", type: "text", readonly: true },
      { name: "method", label: "Method", type: "text", readonly: true },
      { name: "items", label: "Items", type: "json", readonly: true },
      { name: "total_usd", label: "Total (USD)", type: "money", readonly: true },
      { name: "total_credits", label: "Total credits", type: "int", readonly: true },
      { name: "credits_granted", label: "Credits granted", type: "int", readonly: true },
      { name: "points_earned", label: "Points earned", type: "int", readonly: true },
      { name: "status", label: "Status", type: "status", readonly: true }
    ]
  },

  inbox: {
    table: "inbox",
    label: "Message",
    plural: "Inbox",
    noun: "messages",
    section: "inbox",
    canCreate: false,
    titleField: "subject",
    subtitleField: "email",
    statuses: [
      { value: "new", label: "New" },
      { value: "read", label: "Read" },
      { value: "archived", label: "Archived" }
    ],
    stamps: ["created_at"],
    sorts: [
      { key: "newest", label: "Newest" },
      { key: "oldest", label: "Oldest" }
    ],
    filters: [
      {
        key: "kind",
        label: "Kind",
        options: opts("contact", "feedback", "newsletter", "sms", "volunteer")
      }
    ],
    fields: [
      { name: "kind", label: "Kind", type: "text", readonly: true, width: "half" },
      { name: "user_id", label: "Member id", type: "text", readonly: true, width: "half" },
      { name: "name", label: "Name", type: "text", readonly: true, width: "half" },
      { name: "email", label: "Email", type: "text", readonly: true, width: "half" },
      { name: "subject", label: "Subject", type: "text", readonly: true },
      { name: "body", label: "Message", type: "textarea", readonly: true },
      { name: "payload", label: "Form data", type: "json", readonly: true },
      { name: "status", label: "Status", type: "status", side: true }
    ]
  }
};

// URL segment under /crm -> entity key (artists have their own hub pages).
export const SECTIONS = Object.fromEntries(
  Object.entries(ENTITIES)
    .filter(([, def]) => def.section && !def.hidden)
    .map(([key, def]) => [def.section, key])
);

// Sub-tabs shown above lists that share a nav item.
export const SECTION_GROUPS = [
  ["shop", "shop-categories"],
  ["pictures", "photo-categories"],
  ["socials", "social-posts"]
];

export function entityPk(key) {
  return ENTITIES[key]?.pk || "id";
}

export function crmPath(key, id) {
  const def = ENTITIES[key];
  if (!def?.section) return null;
  return id === undefined ? `/crm/${def.section}` : `/crm/${def.section}/${encodeURIComponent(id)}`;
}

export function rowTitle(key, row) {
  const def = ENTITIES[key];
  const value = row?.[def?.titleField];
  if (key === "inbox") {
    const kind = row?.kind ? `${row.kind[0].toUpperCase()}${row.kind.slice(1)}` : "Message";
    return value || `${kind} from ${row?.name || row?.email || "unknown"}`;
  }
  if (key === "social_posts") return value || row?.body?.slice(0, 80) || row?.id;
  if (key === "posts")
    return value || row?.snippet || row?.body?.[0]?.slice(0, 80) || row?.slug || row?.id;
  return value || row?.[entityPk(key)] || "Untitled";
}

export function rowThumb(key, row) {
  const def = ENTITIES[key];
  const value = row?.[def?.thumbField];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function publicPathFor(key, row) {
  const fn = ENTITIES[key]?.publicPath;
  return fn && row ? fn(row) : null;
}

export const THREAD_KINDS = {
  album: "Album",
  video: "Video",
  event: "Event",
  news: "News",
  blog: "Blog",
  social: "Socials"
};

// Public page of a comment thread ("album:<id>" -> /albums/<id>; social posts need the
// network, which the CRM API adds as `thread_network`).
export function threadPath(threadId, network) {
  const [kind, ...rest] = String(threadId || "").split(":");
  const id = rest.join(":");
  if (!id) return null;
  const base = {
    album: "/albums",
    video: "/videos",
    event: "/events",
    news: "/news",
    blog: "/blog"
  }[kind];
  if (base) return `${base}/${id}`;
  if (kind === "social") return network ? `/socials/${network}` : "/socials";
  return null;
}

// "Celestial · Album" from a comment row (thread_title is resolved by the CRM API; null
// means the album/video/… no longer exists).
export function threadLabel(row) {
  const [kind, ...rest] = String(row?.thread_id || "").split(":");
  const ref = rest.join(":");
  const what = THREAD_KINDS[kind] || kind || "Thread";
  if (row?.thread_title) return `${row.thread_title} · ${what}`;
  return `${ref || "Unknown"} · ${what}${row?.thread_title === null ? " (deleted)" : ""}`;
}

// Default values for a new row (create form).
export function emptyRow(key) {
  const row = {};
  for (const field of ENTITIES[key].fields) {
    if (field.readonly) continue;
    if (field.type === "status") row[field.name] = ENTITIES[key].statuses[0].value;
    else if (field.type === "placements") row[field.name] = [];
    else if (["tags", "images", "paragraphs", "list"].includes(field.type)) row[field.name] = [];
    else if (field.type === "map") row[field.name] = {};
    else if (field.type === "bool") row[field.name] = false;
    else if (field.type === "enum")
      row[field.name] = field.required ? field.options[0].value : field.options[0].value;
    else if (field.type === "timezone") row[field.name] = "America/Los_Angeles";
    else if (field.type === "int" || field.type === "duration")
      row[field.name] = field.nullable ? null : 0;
    else row[field.name] = field.nullable ? null : "";
  }
  return row;
}
