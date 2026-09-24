# Projct Music

The website of Projct Music / Truth Studios: music streaming, videos, artists, photos,
news and blog, events, a merch and digital-goods shop, and social feeds — plus a **CRM**
that controls all of it. Content lives in a Postgres database (Neon), seeded with the
original demo data; members sign up, log in and keep a credit balance; payments are
simulated.

Live: https://project-music.tugan.app · CRM: https://project-music.tugan.app/crm

## Accounts

| Who | Where | Login |
| --- | --- | --- |
| CRM admin (the only CRM user) | `/crm` | `nickbrenton` / `nickadmin` |
| Demo member (seeded) | `/login` | `demo` / `demo1234` |

Anyone can create a member account at `/signup` (new members get the sign-up bonus set
in CRM → Settings, 1,000 credits by default).

## CRM

`/crm` manages every piece of public content, with the **artist hub** at its center:
one page per artist (`/crm/artists/<id>`) for the profile and bio plus all of the
artist's music, videos, photos, events, merch, timeline posts and the comments on
them. Every item has **placement toggles** that decide which parts of the site show it
(e.g. an album on the Music tab, Home, the artist page and/or the socials players), and
a published/draft switch.

- **Content**: artists, albums and tracks, videos, events (line-ups, tiers), shop
  products and categories, photos and categories, news / blog / timeline posts, social
  networks and posts. Create, edit, duplicate, delete.
- **Media by URL** (no uploads): images from any https host, direct audio files
  (mp3/m4a/ogg/wav), and videos as mp4/webm files or YouTube / Vimeo links (played as
  embeds). Editors preview each URL.
- **Community and commerce**: comment moderation (hide, edit, delete), members
  (profile, suspend, credit adjustments with a ledger, password reset), orders (with
  refunds), inbox (contact, feedback, newsletter / text sign-ups, volunteers).
- **Site**: settings, a global search, an audit log on the dashboard, "Refresh public
  site", and **Reset to demo data** (content only, or everything incl. members/orders).

Edits show up on the public site right away: each change regenerates the affected
pages (on-demand ISR); everything else refreshes within a minute.

## Features

- **Home**: hero mosaic with the most recent video, rotating featured videos, video strip,
  new releases and an artist wall.
- **Music**: track list and album grid with search and load-more, album pages with
  tracklists, likes, comments, "buy" (stream / stream + download) and add-to-playlist.
- **Global audio player**: queue, play/pause, seek with buffering, previous/next,
  shuffle, repeat (all/one), volume/mute, now-playing art. Playback continues across page
  navigation, the session (including the playback position) survives reloads, and it
  integrates with OS media keys (Media Session API).
- **Videos**: video stage with poster, player (with captions), credits panel, carousel,
  likes, share and comments.
- **Artists and profile**: searchable A–Z artist directory with follows, artist pages with
  music, pictures, timeline, events and bio, plus the user's profile (playlist, liked music,
  purchases, rewards, statistics, feedback).
- **Pictures**: studio, artist, polaroid and "near by" galleries with a keyboard-friendly
  lightbox.
- **News, blog, events, about, contact, volunteer, sign up / login**. Events have tickets,
  RSVPs and calendar (.ics) downloads.
- **Shop**: 12 categories (credits, subscriptions, VIP, packages, t-shirts, hats, CDs,
  vinyl, downloads, tickets, accessories, exclusive), product options and tiers, cart,
  checkout by card or with the site's **credits** currency, credit packs, order history.
- **Socials**: follow/like hub plus Instagram, YouTube, Twitter, SoundCloud, Facebook,
  Tumblr, Vimeo, MySpace, Vine, Pinterest and Wikipedia pages.
- **Members**: sign up / log in / log out, a server-side credit balance and points,
  simulated card payments for credit packs, music, merch and tickets (checkout re-prices
  every item on the server), order history and credit history on the profile, profile
  and password settings. Guests can browse, play and fill the cart; checkout, commenting
  and the profile need an account.
- **Community**: comments stored in the database (reply, like, edit and delete own
  comments with undo; moderation happens in the CRM), chat with conversations and a
  friends list (simulated replies, delete messages/conversations), notifications
  (dismiss / clear), contact, volunteer, newsletter and text-message sign-ups (delivered
  to the CRM inbox), settings (profile edits, photo upload, blocked users, privacy
  toggles).
- **Mega menu** with Home / Shop / Socials tabs, header dropdowns for messages,
  notifications and more, and a "Quick navigation" panel.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / pause |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek 10 seconds |
| <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> | Previous / next track |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Open the Home / Shop / Socials menu |
| Arrow keys (menu open) | Move through the menu |
| <kbd>P</kbd> | Open the playlist / queue |
| <kbd>B</kbd> | Add the current product to the cart (or buy the playing song) |
| <kbd>M</kbd> | Mute |
| <kbd>?</kbd> | Quick navigation |
| <kbd>Esc</kbd> | Close menus and pop-ups |

The single-key shortcuts (letters, numbers, <kbd>?</kbd>) can be turned off in
Settings → General.

## Tech stack

Next.js 16 (Pages Router, ISR), React 19, Tailwind CSS 4 (CSS-first config in
`styles/globals.css`), Headless UI 2, Heroicons 2, Font Awesome 7, react-hot-toast.
Montserrat (via `next/font`) stands in for the mock's Gotham. Neon Postgres through
`@neondatabase/serverless` (plain SQL, no ORM); DB-backed sessions with scrypt password
hashes. Hosted on Vercel; the database is a Neon free-plan project provisioned through
the Vercel Marketplace — see [docs/crm/PROVISIONED_RESOURCES.md](docs/crm/PROVISIONED_RESOURCES.md)
for resources, pricing ($0) and rollback, and
[docs/crm/ARCHITECTURE.md](docs/crm/ARCHITECTURE.md) for the data model and design.

## Getting started

Requires Node.js 20.9 or newer (22+ recommended) and the Vercel CLI linked to the
project for the database connection string.

```bash
npm install
vercel env pull .env.local   # DATABASE_URL and friends
npm run db:migrate           # apply db/schema.sql (idempotent)
npm run db:seed              # reset ALL data (content, members, orders) to the demo
npm run dev                  # http://localhost:3000 (CRM at /crm)
npm run build                # production build
npm run lint                 # ESLint (flat config, eslint-config-next)
```

The local environment uses the same database as production (there is one database for
all environments), so `db:seed` and CRM edits made locally change the live site.

## Project structure

```
pages/            routes (Pages Router); public pages use getStaticProps + ISR
  api/            auth, me, checkout, comments, inbox, public album data
  api/crm/        CRM API (admin session required)
  crm/            the CRM app
components/       page sections and shared UI
  ui/             Button, Modal/Drawer, form fields, SmartImage (any image host), …
  modals/         global pop-ups (cart, checkout, purchase, chat, settings, …)
  comments/       comment threads (DB-backed)
  crm/            CRM layout, entity definitions, editors, artist hub
db/schema.sql     database schema
lib/
  server/         server-only: db client, auth/sessions, API helpers, content queries,
                  seed/reset, checkout pricing, CRM engine, ISR revalidation
  placements.js   which content can appear on which parts of the site
  store.js        browser-local state (cart, likes, follows, playlist, chat,
                  notifications, settings); credits, points and orders come from the server
  SessionProvider.js  the logged-in member (login / signup / logout / profile edits)
  player.js       global audio player (queue, playback, persistence)
  ui.js           pop-ups, mega menu, keyboard "add to cart" target
utils/            the original demo data generators — now only the seed source
scripts/          db:migrate and db:seed
public/           images (including crops from the design mock)
```

## Demo data and media

- Album metadata comes from Spotify "new releases" data, artist photos from the
  projctmusic.com S3 bucket, and extra imagery was cropped from the design mock or comes
  from picsum.photos placeholders.
- Audio uses the SoundHelix sample MP3s and video uses public sample clips (W3C, MDN,
  test-videos.co.uk) until licensed media is available. Clips with sound have English
  captions in `public/captions`. Replace any of them in the CRM with your own URLs
  (YouTube / Vimeo links work for videos).
- The database is seeded from the generators in `utils/` (same ids as before, so old
  links keep working) together with a few demo members, orders and inbox messages. CRM →
  Settings → **Reset to demo data** (or `npm run db:seed`) restores it.
- Payments are simulated: card checkouts always succeed, credits are real balances on
  the member's account. Messages, likes, follows, playlists and notifications stay in the
  browser; **Reset demo data** in the "…" menu or in Settings resets that browser state
  (not the database).
