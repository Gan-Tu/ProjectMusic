-- Projct Music database schema (Neon Postgres).
--
-- Idempotent: safe to run on every deploy / `npm run db:migrate`. Content rows are
-- seeded from the original demo data (see lib/server/seed.js) and can be reset from
-- the CRM.
--
-- Conventions for public content tables:
--   id          text slug used in public URLs (stable, lowercase, [a-z0-9-])
--   status      'published' (visible) | 'draft' (hidden everywhere, detail page 404s)
--   placements  surfaces the row is listed on (see lib/placements.js). A published
--               row with no placements is "unlisted": its detail page still works.
--   sort_order  ascending order within a surface (ties: newest first / name)

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- artists

create table if not exists artists (
  id text primary key,
  name text not null,
  location text not null default '',
  image_url text not null default '',          -- square portrait (the "imgUrl")
  cover_image_url text,                        -- wide crop for the home wall / videos
  tagline text not null default '',
  bio text not null default '',
  followers integer not null default 0 check (followers >= 0),
  listeners integer not null default 0 check (listeners >= 0),
  sessions integer not null default 0 check (sessions >= 0),
  links jsonb not null default '{}'::jsonb,    -- { website, instagram, youtube, ... } urls
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- music

create table if not exists albums (
  id text primary key,
  name text not null,
  artist_name text not null default 'Various Artists', -- credited artist(s), display text
  artist_id text references artists(id) on delete set null, -- roster artist (optional)
  cover_url text not null default '',
  release_date date,
  album_type text not null default 'album' check (album_type in ('album', 'single', 'ep', 'compilation')),
  description text not null default '',
  external_url text,                           -- e.g. the release on Spotify
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists albums_artist_idx on albums (artist_id);

create table if not exists tracks (
  id text primary key,
  album_id text not null references albums(id) on delete cascade on update cascade,
  number integer not null default 1 check (number >= 1),
  title text not null,
  artist_name text,                            -- null: the album's artist_name
  duration integer not null default 180 check (duration >= 0), -- seconds
  audio_url text not null default '',          -- direct audio file (mp3/m4a/ogg/wav)
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tracks_album_idx on tracks (album_id, number);

-- "On rotation": albums an artist recommends (shown on the artist page's music tab).
create table if not exists artist_rotation (
  artist_id text not null references artists(id) on delete cascade on update cascade,
  album_id text not null references albums(id) on delete cascade on update cascade,
  position integer not null default 0,
  primary key (artist_id, album_id)
);

-- ---------------------------------------------------------------- videos

create table if not exists videos (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  artist_id text references artists(id) on delete set null on update cascade,
  artist_name text,                            -- display override / non-roster artist
  description text not null default '',
  video_url text not null default '',          -- mp4/webm file, or a YouTube / Vimeo link
  poster_url text not null default '',
  captions_url text,                           -- WebVTT captions (file videos only)
  duration integer not null default 0 check (duration >= 0), -- seconds
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  published_on date not null default current_date,
  credits jsonb not null default '[]'::jsonb,  -- [{ role, name }]
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists videos_artist_idx on videos (artist_id);

-- ---------------------------------------------------------------- events

create table if not exists events (
  id text primary key,
  title text not null,
  subtitle text not null default '',           -- "name" in the original demo data
  starts_at timestamptz not null,
  time_zone text not null default 'America/Los_Angeles', -- IANA zone of the venue
  city text not null default '',
  venue text not null default '',
  street text not null default '',
  locality text not null default '',           -- e.g. "Hollywood, CA 90068"
  image_url text not null default '',
  description text not null default '',
  tiers jsonb not null default '[]'::jsonb,    -- [{ name, price, credits, description }]
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_lineup (
  event_id text not null references events(id) on delete cascade on update cascade,
  artist_id text not null references artists(id) on delete cascade on update cascade,
  position integer not null default 0,
  primary key (event_id, artist_id)
);
create index if not exists event_lineup_artist_idx on event_lineup (artist_id);

-- ---------------------------------------------------------------- shop

create table if not exists product_categories (
  slug text primary key,
  label text not null,
  icon text not null default 'bag',            -- key into the shop's icon map
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  category text not null references product_categories(slug) on update cascade,
  kind text not null default 'merch' check (kind in ('merch', 'digital', 'ticket')),
  subtitle text,
  description text not null default '',
  price numeric(10, 2) check (price is null or price >= 0),  -- USD; null = credits only
  credits integer check (credits is null or credits >= 0),   -- null = card only
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  tiers jsonb not null default '[]'::jsonb,    -- [{ id, label, price, credits, grantsCredits? }]
  grants_credits integer check (grants_credits is null or grants_credits > 0), -- credit packs
  grants_downloads boolean not null default false, -- download passes
  artist_id text references artists(id) on delete set null on update cascade,
  album_id text references albums(id) on delete set null on update cascade,   -- vinyl / CD editions
  event_id text references events(id) on delete cascade on update cascade,    -- tickets
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  added_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products (category);
create index if not exists products_artist_idx on products (artist_id);

-- ---------------------------------------------------------------- pictures

create table if not exists photo_categories (
  id text primary key,
  name text not null,
  description text not null default '',
  image_url text not null default '',
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists photos (
  id text primary key,
  category_id text references photo_categories(id) on delete set null on update cascade,
  artist_id text references artists(id) on delete set null on update cascade,
  src text not null,
  caption text not null default '',
  location text not null default '',
  alt text,
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists photos_category_idx on photos (category_id);
create index if not exists photos_artist_idx on photos (artist_id);

-- ---------------------------------------------------------------- news, blog, timeline

create table if not exists posts (
  id text primary key,                         -- internal id
  section text not null check (section in ('news', 'blog', 'timeline')),
  slug text not null,                          -- public id: /news/<slug>, /blog/<slug>
  title text not null default '',
  author text not null default 'Nick Breton',
  image_url text not null default '',
  snippet text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  body text[] not null default '{}',           -- paragraphs
  artist_id text references artists(id) on delete set null on update cascade,
  published_on date not null default current_date,
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, slug)
);
create index if not exists posts_artist_idx on posts (artist_id);
-- News/blog posts outlive a deleted artist (the CRM deletes an artist's timeline posts
-- explicitly). Re-declared so databases created before this rule pick it up.
alter table posts drop constraint if exists posts_artist_id_fkey;
alter table posts add constraint posts_artist_id_fkey foreign key (artist_id)
  references artists(id) on delete set null on update cascade;

-- ---------------------------------------------------------------- socials

create table if not exists social_networks (
  id text primary key,                         -- instagram, youtube, twitter, ...
  name text not null,
  handle text not null default '',
  followers integer not null default 0 check (followers >= 0),
  url text not null default '',
  color text not null default '#000000',
  icon text not null default '',               -- Font Awesome brand icon name
  status text not null default 'published' check (status in ('published', 'draft')),
  placements text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists social_posts (
  id text primary key,
  network_id text not null references social_networks(id) on delete cascade on update cascade,
  kind text not null default 'photo' check (kind in ('photo', 'text', 'quote', 'video')),
  title text,
  body text not null default '',               -- caption / tweet text
  image_url text,
  video_url text,
  alt text,
  artist_id text references artists(id) on delete set null on update cascade,
  posted_on date not null default current_date,
  likes integer not null default 0,
  comment_count integer not null default 0,
  replies integer not null default 0,
  reposts integer not null default 0,
  views integer not null default 0,
  duration text,
  board text,                                  -- Pinterest board
  ratio text,                                  -- Pinterest aspect ratio, e.g. "3 / 4"
  conversation jsonb not null default '[]'::jsonb, -- [{ author, text }] preview replies
  status text not null default 'published' check (status in ('published', 'draft')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_posts_network_idx on social_posts (network_id, sort_order);

-- ---------------------------------------------------------------- members

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null,                      -- stored lowercase
  email text not null,                         -- stored lowercase
  name text not null,
  password_hash text not null,                 -- scrypt (lib/server/auth.js)
  avatar_url text,
  location text not null default '',
  bio text not null default '',
  credits integer not null default 0 check (credits >= 0),
  points integer not null default 0 check (points >= 0),
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_demo boolean not null default false,      -- the shared demo account (seeded)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists users_username_key on users (username);
create unique index if not exists users_email_key on users (email);

-- Login sessions for members (kind 'user') and the CRM admin (kind 'admin').
-- The cookie holds a random token; only its SHA-256 is stored.
create table if not exists sessions (
  id text primary key,                         -- sha256(token), hex
  kind text not null default 'user' check (kind in ('user', 'admin')),
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  user_agent text
);
create index if not exists sessions_user_idx on sessions (user_id);

-- Fixed-window request counters (login / signup / comment / inbox throttles). A slot
-- is reserved atomically before the work happens, so concurrent requests can't all
-- slip under the limit (lib/server/rateLimit.js).
create table if not exists rate_limits (
  key text not null,                           -- e.g. "login:203.0.113.7"
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);
create index if not exists rate_limits_window_idx on rate_limits (window_start);
create index if not exists sessions_expires_idx on sessions (expires_at);

create table if not exists orders (
  id text primary key,                         -- e.g. PM-LX2K9Q
  user_id uuid references users(id) on delete set null,
  method text not null check (method in ('credits', 'card')),
  items jsonb not null default '[]'::jsonb,    -- purchased lines, prices as charged
  total_usd numeric(10, 2) not null default 0,
  total_credits integer not null default 0,
  credits_granted integer not null default 0,
  points_earned integer not null default 0,
  status text not null default 'completed' check (status in ('completed', 'refunded', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);

-- Every change to a member's credit balance, for their history and the CRM audit.
create table if not exists credit_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null check (reason in ('signup_bonus', 'order', 'credit_pack', 'admin_adjustment', 'refund', 'seed')),
  order_id text references orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on credit_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------- community

create table if not exists comments (
  id text primary key,
  thread_id text not null,                     -- album:<id> | video:<id> | event:<id> | news:<slug> | blog:<slug> | social:<postId>
  user_id uuid references users(id) on delete set null,
  author_name text not null,
  author_avatar text,
  body text not null,
  likes integer not null default 0 check (likes >= 0),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists comments_thread_idx on comments (thread_id, created_at desc);
create index if not exists comments_user_idx on comments (user_id);

-- Contact form, feedback and sign-ups (newsletter / text messages / volunteer).
create table if not exists inbox (
  id text primary key,
  kind text not null check (kind in ('contact', 'feedback', 'newsletter', 'sms', 'volunteer')),
  user_id uuid references users(id) on delete set null,
  name text,
  email text,
  subject text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);
create index if not exists inbox_created_idx on inbox (created_at desc);

-- ---------------------------------------------------------------- site

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  actor text not null,                         -- 'admin:<email>', 'user:<id>', 'system'
  action text not null,                        -- create | update | delete | reset | adjust_credits | ...
  entity text not null,                        -- table name
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);

-- ---------------------------------------------------------------- triggers

do $$
declare t text;
begin
  foreach t in array array[
    'artists', 'albums', 'tracks', 'videos', 'events', 'product_categories', 'products',
    'photo_categories', 'photos', 'posts', 'social_networks', 'social_posts', 'users'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;
