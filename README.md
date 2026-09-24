# Projct Music

The website of Projct Music / Truth Studios: music streaming, videos, artists, photos,
news and blog, events, a merch and digital-goods shop, and social feeds. It's a
single-user demo: the visitor is logged in as **Nick Breton**. There is no backend. All
catalog data is static and user state is saved in the browser.

Live: https://project-music.tugan.app

## Features

- **Home**: hero mosaic with the most recent video, rotating featured videos, video strip,
  new releases and an artist wall.
- **Music**: track list and album grid with search and load-more, album pages with
  tracklists, likes, comments, "buy" (stream / stream + download) and add-to-playlist.
- **Global audio player**: queue, play/pause, seek with buffering, previous/next,
  shuffle, repeat (all/one), volume/mute, now-playing art. Playback continues across page
  navigation, the session survives reloads, and it integrates with OS media keys (Media
  Session API).
- **Videos**: video stage with poster, player, credits panel, carousel, likes, share and
  comments.
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
- **Community**: comments with reply, like, edit and delete (with undo; as the site admin
  the user can also remove other people's comments), chat with conversations and a friends
  list (simulated replies, delete messages/conversations), notifications (dismiss / clear),
  newsletter and text-message sign-up, settings (profile edits, photo upload, blocked users,
  privacy toggles).
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

## Tech stack

Next.js 16 (Pages Router, static generation), React 19, Tailwind CSS 4 (CSS-first config
in `styles/globals.css`), Headless UI 2, Heroicons 2, Font Awesome 7, react-hot-toast.
Montserrat (via `next/font`) stands in for the mock's Gotham.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint (flat config, eslint-config-next)
```

## Project structure

```
pages/            routes (Pages Router); dynamic pages are statically generated
components/       page sections and shared UI
  ui/             Button, Modal/Drawer, form fields, toggle, captcha
  modals/         global pop-ups (cart, checkout, purchase, chat, settings, …)
  comments/       shared comment threads
lib/
  store.js        app state (cart, purchases, credits, likes, follows, playlist, chat,
                  notifications, comments, settings), persisted to localStorage
  player.js       global audio player (queue, playback, persistence)
  ui.js           pop-ups, mega menu, keyboard "add to cart" target
  SessionProvider.js  the single demo user (login / logout / profile edits)
utils/            static demo data (albums, artists, videos, products, events, posts…)
public/           images (including crops from the design mock)
```

## Demo data and media

- Album metadata comes from Spotify "new releases" data, artist photos from the
  projctmusic.com S3 bucket, and extra imagery was cropped from the design mock or comes
  from picsum.photos placeholders.
- Audio uses the SoundHelix sample MP3s and video uses public sample clips (W3C, MDN,
  test-videos.co.uk) until licensed media is available.
- Purchases, credits and messages are simulated. Clear the site's local storage to reset
  the demo.
