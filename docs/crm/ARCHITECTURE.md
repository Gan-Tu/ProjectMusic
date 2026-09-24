# Projct Music — database, accounts and CRM

This document is the contract for turning the static demo into a database-backed site
with member accounts and an admin CRM. Read it fully before changing code.

## 1. What we are building

- **Database**: Neon Postgres (free plan, provisioned through Vercel; env vars in
  `.env.local` and on Vercel). Schema: `db/schema.sql` (already applied; idempotent,
  re-run with `npm run db:migrate`). Everything the public site shows — artists, albums
  and tracks, videos, events, merch and digital products, photos, news/blog/timeline
  posts, social pages, comments — comes from the database. It is seeded from the
  original demo data (the `utils/getFake*.js` generators stay as the **seed source**)
  and can be reset to it.
- **Public site** (existing Next.js 16 Pages Router app): pages read the DB in
  `getStaticProps` through `lib/server/content.js`, with ISR (`revalidate: 60`) plus
  on-demand revalidation (`res.revalidate(path)`) triggered by CRM edits. Dynamic
  routes use `fallback: "blocking"` so newly created content works immediately.
- **Member accounts**: sign up / log in / log out, a server-side credit balance and
  points, fake payments (card or credits) for credit packs, music, merch and tickets,
  order history, credit history. Comments are real (stored in the DB, visible to all).
- **CRM** at `/crm` (single admin: username `nickbrenton`, password `nickadmin`):
  manage every entity, centered on **the artist hub** — one page per artist that
  manages the artist's profile/bio and *all* of their linked content (music, videos,
  photos, events, merch, posts, comments) with per-item toggles for **which public
  surfaces show it** (placements). Also: members & credits, orders, comment moderation,
  inbox (contact/feedback/sign-ups), site settings, and **Reset to demo data**.
- **Media**: no uploads. Admins paste URLs: images (any https host), direct audio
  files (mp3/m4a/ogg/wav), and videos as direct files (mp4/webm) **or YouTube / Vimeo
  links** (rendered as embeds).

## 2. Data model

See `db/schema.sql` for columns. Relationships:

```
artists 1─* albums (albums.artist_id, optional: roster artist credited on the release)
artists *─* albums via artist_rotation   ("On rotation" picks on the artist page)
albums  1─* tracks (cascade)
artists 1─* videos (videos.artist_id)
events  *─* artists via event_lineup (ordered by position)
products *─1 product_categories (products.category)
products ─ optional links: artist_id (merch), album_id (vinyl/CD), event_id (tickets)
photos  *─1 photo_categories (optional), photos.artist_id (optional)
posts   (section news | blog | timeline), posts.artist_id (optional; timeline posts
         belong to an artist)
social_networks 1─* social_posts (social_posts.artist_id optional)
users 1─* orders, users 1─* credit_ledger, users 1─* comments, users 1─* sessions
comments.thread_id = "<kind>:<id>" where kind ∈ album | video | event | news | blog | social
```

Every public content row has `status` (`published` | `draft`), `placements`
(text[] of surface keys) and `sort_order`. **Placements** are defined in
`lib/placements.js` (e.g. an album can be on `music`, `home`, `artist`, `socials`).
Rules for the public site:

- A `draft` row is invisible everywhere; its detail page returns 404.
- A published row is **listed** on a surface only if that surface's key is in
  `placements`. A published row with no placements is *unlisted*: its detail page
  still renders (reachable by direct link).
- Lists are ordered by `sort_order` asc, then a sensible secondary key (date desc,
  name asc).
- Tracks follow their album (plus their own `status`).

Artist page (`/artists/<id>`) content, all filtered to published rows:

| Tab | Source |
| --- | --- |
| Music | albums with `artist_id = <id>` and placement `artist` ("Discography"), then `artist_rotation` picks ("On rotation") |
| Videos (new) | videos with `artist_id = <id>` and placement `artist` |
| Pictures | photos with `artist_id = <id>` and placement `artist` |
| Timeline | posts with `artist_id = <id>` and placement `artist` (timeline posts, plus news/blog posts linked to the artist, newest first) |
| Events | events whose line-up contains the artist, with placement `artist` |
| Merch (new) | products with `artist_id = <id>` and placement `artist` (plus vinyl/CD products whose album is the artist's) |
| About | artist bio, location, links |

Tabs other than Music/Timeline/About are hidden when empty.

## 3. Seed data (`lib/server/seed.js`)

`buildSeedData()` derives every table's rows from the existing generators in `utils/`
(so the seeded site looks exactly like the original demo). `applySeed({ scope })`
replaces the data in one transaction:

- `scope: "content"` — all public content tables, comments, site_settings.
- `scope: "all"` — content plus users, sessions of members (never admin sessions),
  orders, credit_ledger, inbox. Recreates the demo member account.

The **demo member account**: username `demo`, password `demo1234`, name "Nick Breton",
email `info@truthstudios.com`, avatar = the original profile avatar, 3,740 credits,
21,665 points, `is_demo = true`. New sign-ups receive the `signup_bonus_credits`
setting (seeded as 1,000) as a `signup_bonus` ledger entry.

## 4. Server modules (all server-only, never import from client components)

| Module | Owner | Purpose |
| --- | --- | --- |
| `lib/server/db.js` | shared (done) | `sql` tagged template (HTTP), `sql.query(text, params)`, `sql.transaction([...])`, `withTransaction(async client => …)`, `runScript(text)` |
| `lib/server/auth.js` | shared (done) | password hashing (scrypt), DB sessions, cookies `pm_session` (members) / `pm_admin` (CRM), `getSessionUser(req)`, `getSessionAdmin(req)`, `createSession`, `destroySession`, `publicUser(row)`, `checkAdminCredentials` |
| `lib/server/http.js` | shared (done) | `apiHandler({ GET, POST, … })` (405s, same-origin + JSON check on mutations, error → JSON), `HttpError`, `requireUser`, `requireAdmin`, input helpers `str`, `int`, `url`, `slugify`, `makeId` |
| `lib/placements.js` | shared (done) | placement catalog (client-safe) |
| `lib/server/rateLimit.js` | shared (done) | `rateLimit(req, res, { key, limit, windowSeconds })` — atomic fixed-window throttle (reserve-then-work, `release()` to refund), `clientIp(req)`; used by login, signup, CRM login, comments, inbox |
| `lib/server/seed.js` | Seed agent | `buildSeedData()`, `applySeed({ scope })` |
| `lib/server/content.js` | Public-site agent | read queries returning the shapes pages already use |
| `lib/server/revalidate.js` | CRM agent | `revalidatePaths(res, paths)`, `pathsForChange(entity, ids…)` |
| `lib/server/pricing.js` | Accounts agent | authoritative server-side price check for checkout lines |

API conventions: `pages/api/**`, wrap handlers with `apiHandler`; JSON in/out;
errors as `{ error }` with a 4xx status; mutations need `Content-Type:
application/json` (the client must send it, also for bodyless POSTs send `{}`).
Write an `audit_log` row for every CRM mutation (`actor: "admin:nickbrenton"`).

### API map

| Route | Owner |
| --- | --- |
| `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout` | Accounts |
| `GET/PATCH /api/me`, `POST /api/me/password`, `GET /api/me/orders`, `GET /api/me/credits` | Accounts |
| `POST /api/checkout` | Accounts |
| `GET/POST /api/comments`, `PATCH/DELETE /api/comments/[id]` | Public site |
| `POST /api/inbox` (contact, feedback, newsletter, sms, volunteer) | Public site |
| `GET /api/public/albums/[id]` (tracks on demand, if needed) | Public site |
| `/api/crm/**` (login, logout, session, CRUD, placements, reset, revalidate, stats) | CRM |

## 5. Public content layer (`lib/server/content.js`)

Returns plain JSON-serializable objects (dates as ISO strings / `YYYY-MM-DD`), using
the **field names the existing components already expect** so components change as
little as possible:

- Artist: `{ id, name, location, imgUrl, coverImage }` (+ profile: `bio, tagline,
  followers, listeners, sessions, links`).
- Album summary: `{ id, name, img_url, release_date, artist, artistId, totalTracks,
  albumType }`, optionally `tracks`.
- Track: `{ id, number, title, artist, cover, albumId, albumName, duration, src }`
  (`src` = `audio_url`; the player already prefers `track.src`).
- Video: current `getFakeVideos` shape (`id, title, artist, artistId, artistImage,
  subtitle, duration, poster, src, captions, views, likes, date, description,
  credits`).
- Event: current `getFakeEvents` shape (`id, title, name, year, month, day, time,
  date, startsAt, timeZone, city, address[3], image, price, credits, lineup[artist],
  description, tiers`).
- Product: current `getFakeProducts` shape (`id, name, category, kind, price, credits,
  images, description, sizes, colors, tiers, featured, grantsCredits,
  grantsDownloads, artist, albumId, eventId, cartId, startsAt, subtitle, addedAt`).
  Tickets derive price/tiers/startsAt from their event.
- Photo: `{ id, src, caption, location }`; category `{ id, name, description, image }`.
- Post: `{ id: slug, title, date: "September 22, 2026", author, imgUrl, snippet,
  category, tags, body }`.

Suggested functions (the Accounts agent's `pages/profile.js` uses the first three):
`listAlbums({ placement, limit, tracks })`, `listArtists({ placement, limit })`,
`listPhotos({ categoryId, artistId, placement, limit })`, `getHomePage()`,
`getArtistPage(id)`, `getAlbumPage(id)`, `listVideos`, `getVideoPage(id)`,
`listEvents`, `getEvent(id)`, `listProducts`, `listProductCategories`,
`getProductPage(id)`, `listPhotoCategories`, `getPhotoCategoryPage(id)`,
`listPosts(section)`, `getPostPage(section, slug)`, `listSocialNetworks`,
`getSocialPage(network)`.

## 6. Images and media

- Admin-supplied image URLs can be on any host. `next/image` only optimizes the hosts
  in `next.config.js`; everything else must render `unoptimized`. The public-site
  agent adds `components/ui/SmartImage.js` (drop-in for `next/image`, sets
  `unoptimized` for unknown hosts and `data:` URLs) and switches imports to it.
- Video URLs: `lib/media.js` gets `parseVideoUrl(url)` → `{ type: "youtube" | "vimeo"
  | "file", id?, embedUrl?, src }`. Video players render an iframe embed for
  YouTube/Vimeo (`youtube-nocookie.com`) and `<video>` for files.
- Audio: tracks carry `src` (direct file URL).

## 7. Revalidation

Public pages: `getStaticProps` returns `revalidate: 60`; dynamic routes return
`paths: []` (or a few) with `fallback: "blocking"` and `notFound: true` for missing /
draft rows. The CRM calls `res.revalidate()` for the affected paths after each
mutation (list pages + detail pages + home + linked artist pages), and offers a
"Refresh public site" action that revalidates every list page.

Public routes: `/`, `/musics`, `/albums`, `/albums/[id]`, `/artists`,
`/artists/[id]`, `/videos`, `/videos/[id]`, `/events`, `/events/[id]`, `/shop`,
`/shop/[id]`, `/pictures`, `/pictures/[category]`, `/news`, `/news/[id]`, `/blog`,
`/blog/[id]`, `/socials`, `/socials/[network]`, `/profile`.

## 8. Accounts on the public site

- Visitors start as **guests** (no more implicit "logged in as Nick Breton"). Guests
  browse, play music, like/follow (browser-local) and fill the cart; **checkout,
  commenting and the profile page require logging in** (send them to
  `/login?next=<current path>`).
- `lib/SessionProvider.js` loads the member from `GET /api/me` and exposes login,
  signup, logout, profile updates. `session.user` keeps the fields components use
  (`name, username, email, avatar, role`) plus `id, credits, points`.
- `lib/store.js`: credits, points and purchases for a logged-in member come from the
  server; checkout calls `POST /api/checkout`, which re-prices every line from the DB /
  `lib/pricing.js`, charges credits atomically, records the order and ledger entries,
  and returns the new balance. Other state (cart, likes, follows, playlist, settings,
  chats, notifications) stays browser-local.

## 9. Style

- Match existing code: JavaScript (no TypeScript), Prettier (`printWidth 100`, double
  quotes, semicolons, no trailing commas), functional React components, Tailwind CSS 4
  utility classes, Heroicons / Font Awesome, `components/ui/*` primitives.
- Visual language: black / neutral-900 surfaces, white content areas, the `pmred`
  accent (`--color-pmred`, `pmred-dark`, `pmred-light`), uppercase bold labels with wide
  tracking (`text-2xs font-bold uppercase tracking-widest`), square cards, pill
  buttons (`components/ui/Button.js`), Montserrat.
- Accessibility as in the rest of the app: labels on inputs, focus-visible outlines,
  `aria-*` on toggles, keyboard support.
