import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ArrowTopRightOnSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/format";
import { ENTITIES, entityPk } from "./entityDefs";
import { crmFetch, entityApi, invalidateOptions, queryString, useCrmData, useOptions } from "./api";
import ContentRow, { PlacementChips, StatusToggle } from "./ContentRow";
import { confirmDelete } from "./EntityListView";
import EntityEditor from "./EntityEditor";
import OrderedPicker from "./OrderedPicker";
import { formatCount } from "./format";
import {
  CONTROL,
  Card,
  EmptyState,
  ErrorNote,
  INPUT,
  Spinner,
  TEXTAREA,
  Thumb,
  CrmButton as Button
} from "./ui";

const HUB_SELECT = `${CONTROL} h-10 cursor-pointer border-neutral-200 pl-4 pr-8 text-xs sm:h-9`;

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "music", label: "Music", count: "album_count" },
  { id: "videos", label: "Videos", count: "video_count" },
  { id: "photos", label: "Photos", count: "photo_count" },
  { id: "events", label: "Events", count: "event_count" },
  { id: "merch", label: "Merch", count: "product_count" },
  { id: "posts", label: "Posts", count: "post_count" },
  { id: "comments", label: "Comments" }
];

// Rows of one entity linked to the artist, with instant status/placement toggles.
function HubList({ entity, artistId, version, grid = false, emptyText, rowExtra }) {
  const def = ENTITIES[entity];
  const pk = entityPk(entity);
  const url =
    entityApi(entity) +
    queryString({ artist: artistId, pageSize: 200, sort: def.sorts?.[0]?.key, v: version });
  const { data, error, loading, setData } = useCrmData(url);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (loading && !data) return <Spinner />;
  const rows = data?.rows || [];
  if (!rows.length)
    return <EmptyState title={`No ${def.plural.toLowerCase()} yet`}>{emptyText}</EmptyState>;
  const update = (id) => (updater) =>
    setData((current) => ({
      ...current,
      rows: current.rows.map((row) => (row[pk] === id ? updater(row) : row))
    }));
  const remove = async (row) => {
    if (await confirmDelete(entity, row)) {
      setData((current) => ({
        ...current,
        rows: current.rows.filter((item) => item[pk] !== row[pk])
      }));
    }
  };
  return (
    <ul
      className={
        grid
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4"
          : "divide-y divide-neutral-100 border border-neutral-200 bg-white"
      }
    >
      {rows.map((row) => (
        <ContentRow
          key={row[pk]}
          entity={entity}
          row={row}
          grid={grid}
          onChange={update(row[pk])}
          onDelete={remove}
        >
          {rowExtra?.(row)}
        </ContentRow>
      ))}
    </ul>
  );
}

// "Link existing …": sets artist_id on a row that isn't linked to this artist yet.
function LinkExisting({ entity, artistId, onLinked, label }) {
  const options = useOptions([entity])[entity] || [];
  const candidates = options.filter((option) => option.artist_id !== artistId);
  const [busy, setBusy] = useState(false);
  async function link(id) {
    if (!id) return;
    setBusy(true);
    try {
      await crmFetch(entityApi(entity, id), { method: "PATCH", body: { artist_id: artistId } });
      invalidateOptions(entity);
      toast.success(`${ENTITIES[entity].label} linked.`);
      onLinked();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <select
      value=""
      disabled={busy}
      onChange={(event) => link(event.target.value)}
      aria-label={label}
      className={classNames(HUB_SELECT, "max-w-64")}
    >
      <option value="">{label}</option>
      {candidates.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.hint ? ` — ${option.hint}` : ""}
        </option>
      ))}
    </select>
  );
}

function newHref(section, params) {
  return `/crm/${section}/new${queryString(params)}`;
}

function RotationEditor({ artist, onSaved }) {
  const [value, setValue] = useState(artist.rotation || []);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(artist.rotation || []);
  async function save() {
    setBusy(true);
    try {
      const { row } = await crmFetch(entityApi("artists", artist.id), {
        method: "PATCH",
        body: { rotation: value }
      });
      onSaved(row);
      toast.success("On rotation saved.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card
      title="On rotation"
      actions={
        <Button size="sm" onClick={save} disabled={!dirty || busy}>
          {busy ? "Saving…" : "Save picks"}
        </Button>
      }
    >
      <p className="mb-4 text-xs text-neutral-500">
        Albums the artist recommends, in order — any album in the catalog, shown under &ldquo;On
        rotation&rdquo; on the artist&apos;s music tab.
      </p>
      <OrderedPicker
        type="albums"
        value={value}
        onChange={setValue}
        addLabel="Add an album to the rotation…"
        emptyText="No picks yet."
      />
    </Card>
  );
}

function LineupAdd({ artistId, onChanged }) {
  const events = useOptions(["events"]).events || [];
  const [busy, setBusy] = useState(false);
  async function add(eventId) {
    if (!eventId) return;
    setBusy(true);
    try {
      await crmFetch(`/api/crm/artists/${encodeURIComponent(artistId)}/lineup`, {
        method: "POST",
        body: { eventId, action: "add" }
      });
      toast.success("Added to the line-up.");
      onChanged();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <select
      value=""
      disabled={busy}
      onChange={(event) => add(event.target.value)}
      aria-label="Add to an event's line-up"
      className={classNames(HUB_SELECT, "max-w-72")}
    >
      <option value="">Add to an event line-up…</option>
      {events.map((event) => (
        <option key={event.value} value={event.value}>
          {event.label} — {event.hint}
        </option>
      ))}
    </select>
  );
}

function TimelineComposer({ artistId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", body: "" });
  const set = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await crmFetch(entityApi("posts"), {
        method: "POST",
        body: {
          section: "timeline",
          artist_id: artistId,
          title: form.title,
          image_url: form.image_url,
          body: form.body.split(/\n\s*\n/),
          snippet: form.body.trim().slice(0, 200),
          placements: ["artist"],
          status: "published"
        }
      });
      toast.success("Timeline post published.");
      setForm({ title: "", image_url: "", body: "" });
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" /> Timeline post
      </Button>
    );
  }
  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-3 border border-pmred/30 bg-pmred/5 p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-2xs font-bold uppercase tracking-widest text-pmred-dark">
          New timeline post
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-neutral-400 hover:text-pmred"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <input
        value={form.title}
        onChange={set("title")}
        placeholder="Title (optional)"
        aria-label="Title"
        className={INPUT}
      />
      <input
        type="text"
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        value={form.image_url}
        onChange={set("image_url")}
        placeholder="Image URL (optional)"
        aria-label="Image URL"
        className={INPUT}
      />
      <textarea
        value={form.body}
        onChange={set("body")}
        rows={4}
        placeholder="What's new? Separate paragraphs with a blank line."
        aria-label="Text"
        className={TEXTAREA}
      />
      <div>
        <Button type="submit" size="md" disabled={busy || !(form.title.trim() || form.body.trim())}>
          {busy ? "Posting…" : "Publish to timeline"}
        </Button>
      </div>
    </form>
  );
}

function RemoveFromLineup({ artistId, eventId, onChanged }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await crmFetch(`/api/crm/artists/${encodeURIComponent(artistId)}/lineup`, {
            method: "POST",
            body: { eventId, action: "remove" }
          });
          toast.success("Removed from the line-up.");
          onChanged();
        } catch (error) {
          toast.error(error.message);
        }
      }}
      className="rounded-full border border-neutral-200 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-neutral-500 transition hover:border-pmred hover:text-pmred max-sm:min-h-10"
    >
      Remove from line-up
    </button>
  );
}

export default function ArtistHub({ id }) {
  const router = useRouter();
  const tab = TABS.some((item) => item.id === router.query.tab) ? router.query.tab : "profile";
  const { data, error, loading, setData, reload } = useCrmData(entityApi("artists", id));
  const [version, setVersion] = useState(0);
  const artist = data?.row;
  const refresh = () => {
    setVersion((n) => n + 1);
    reload();
  };
  const selectTab = (next) =>
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: next } },
      undefined,
      {
        shallow: true,
        scroll: false
      }
    );

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (loading || !artist) return <Spinner label="Loading artist…" />;

  const updateArtist = (updater) =>
    setData((current) => ({ ...current, row: updater(current.row) }));
  const prefill = { artist_id: artist.id };

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden bg-black text-white">
        {artist.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- admin URL from any host
          <img
            src={artist.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:p-8">
          <Thumb
            src={artist.image_url}
            alt={artist.name}
            className="w-28 border-4 border-white sm:w-36"
          />
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-bold uppercase tracking-[0.3em] text-pmred-light">
              Artist hub
            </p>
            <h2 className="mt-2 truncate text-3xl font-black uppercase tracking-tight sm:text-4xl">
              {artist.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-300">{artist.location || "No location"}</p>
            <dl className="mt-4 flex flex-wrap gap-6">
              {[
                ["Followers", artist.followers],
                ["Listeners", artist.listeners],
                ["Sessions", artist.sessions]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-2xs font-bold uppercase tracking-widest text-neutral-400">
                    {label}
                  </dt>
                  <dd className="text-lg font-extrabold">{formatCount(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <StatusToggle entity="artists" row={artist} onChange={updateArtist} />
              {artist.status !== "draft" && (
                <Button
                  href={`/artists/${artist.id}`}
                  variant="light"
                  size="sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" /> View on site
                </Button>
              )}
            </div>
            <PlacementChips
              entity="artists"
              row={artist}
              onChange={updateArtist}
              className="sm:justify-end"
            />
          </div>
        </div>
      </section>

      <nav
        aria-label="Artist sections"
        className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-neutral-200 px-4 sm:mx-0 sm:px-0"
      >
        {TABS.map((item) => {
          const active = item.id === tab;
          const count = item.count ? artist[item.count] : undefined;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={classNames(
                "shrink-0 border-b-2 px-4 py-3 text-2xs font-bold uppercase tracking-widest transition-colors",
                active
                  ? "border-pmred text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-pmred"
              )}
            >
              {item.label}
              {count !== undefined && <span className="ml-1.5 text-neutral-400">{count}</span>}
            </button>
          );
        })}
      </nav>

      {tab === "profile" && (
        <EntityEditor
          entity="artists"
          id={artist.id}
          hide={["status", "placements"]}
          onSaved={(row) => updateArtist((current) => ({ ...current, ...row }))}
        />
      )}

      {tab === "music" && (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_28rem]">
          <Card
            title="Discography"
            actions={
              <>
                <LinkExisting
                  entity="albums"
                  artistId={artist.id}
                  onLinked={refresh}
                  label="Link existing album…"
                />
                <Button
                  size="sm"
                  href={newHref("music", {
                    ...prefill,
                    artist_name: artist.name,
                    placements: "music,artist"
                  })}
                >
                  <PlusIcon className="h-4 w-4" /> New album
                </Button>
              </>
            }
            bodyClassName="p-0"
          >
            <HubList
              entity="albums"
              artistId={artist.id}
              version={version}
              emptyText="Create an album or link one from the catalog."
            />
          </Card>
          <RotationEditor
            artist={artist}
            onSaved={(row) => updateArtist((current) => ({ ...current, ...row }))}
          />
        </div>
      )}

      {tab === "videos" && (
        <Card
          title="Videos"
          actions={
            <>
              <LinkExisting
                entity="videos"
                artistId={artist.id}
                onLinked={refresh}
                label="Link existing video…"
              />
              <Button
                size="sm"
                href={newHref("videos", { ...prefill, placements: "videos,artist" })}
              >
                <PlusIcon className="h-4 w-4" /> New video
              </Button>
            </>
          }
          bodyClassName="p-0"
        >
          <HubList entity="videos" artistId={artist.id} version={version} />
        </Card>
      )}

      {tab === "photos" && (
        <Card
          title="Photos"
          actions={
            <Button
              size="sm"
              href={newHref("pictures", { ...prefill, placements: "pictures,artist" })}
            >
              <PlusIcon className="h-4 w-4" /> New photo
            </Button>
          }
        >
          <HubList entity="photos" artistId={artist.id} version={version} grid />
        </Card>
      )}

      {tab === "events" && (
        <Card
          title="Events (line-up)"
          actions={
            <>
              <LineupAdd artistId={artist.id} onChanged={refresh} />
              <Button
                size="sm"
                href={newHref("events", { lineup: artist.id, placements: "events,artist" })}
              >
                <PlusIcon className="h-4 w-4" /> New event
              </Button>
            </>
          }
          bodyClassName="p-0"
        >
          <HubList
            entity="events"
            artistId={artist.id}
            version={version}
            emptyText="Add the artist to an event's line-up."
            rowExtra={(row) => (
              <RemoveFromLineup artistId={artist.id} eventId={row.id} onChanged={refresh} />
            )}
          />
        </Card>
      )}

      {tab === "merch" && (
        <Card
          title="Merch"
          actions={
            <Button size="sm" href={newHref("shop", { ...prefill, placements: "shop,artist" })}>
              <PlusIcon className="h-4 w-4" /> New product
            </Button>
          }
          bodyClassName="p-0"
        >
          <HubList
            entity="products"
            artistId={artist.id}
            version={version}
            emptyText="Products linked to the artist, plus vinyl / CD editions of their albums."
          />
        </Card>
      )}

      {tab === "posts" && (
        <Card
          title="Timeline, news & blog"
          actions={
            <>
              <Button
                size="sm"
                variant="outline"
                href={newHref("posts", {
                  ...prefill,
                  section: "news",
                  placements: "listing,artist"
                })}
              >
                <PlusIcon className="h-4 w-4" /> News post
              </Button>
              <TimelineComposer artistId={artist.id} onCreated={refresh} />
            </>
          }
          bodyClassName="p-0"
        >
          <HubList entity="posts" artistId={artist.id} version={version} />
        </Card>
      )}

      {tab === "comments" && (
        <Card title="Comments on the artist's content" bodyClassName="p-0">
          <HubList
            entity="comments"
            artistId={artist.id}
            version={version}
            emptyText="Comments on this artist's albums, videos, events and posts show up here."
          />
        </Card>
      )}
    </div>
  );
}
