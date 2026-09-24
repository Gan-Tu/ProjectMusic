import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/20/solid";
import { PLACEMENTS } from "../../lib/placements";
import { classNames } from "../../lib/format";
import {
  ENTITIES,
  crmPath,
  entityPk,
  publicPathFor,
  rowThumb,
  rowTitle,
  threadLabel
} from "./entityDefs";
import { crmFetch, entityApi, notifyBadges } from "./api";
import { formatCount, formatDateTime, formatDay, formatMoney, timeAgo, toMmSs } from "./format";
import { StatusBadge, Thumb } from "./ui";

// Instant placement chips: flips the chip, PATCHes { placement, enabled }, and flips it
// back (with a toast) if the request fails. `onChange(updater)` updates the row.
export function PlacementChips({ entity, row, onChange, className }) {
  const catalog = PLACEMENTS[ENTITIES[entity]?.placements] || [];
  if (!catalog.length) return null;
  const current = row.placements || [];
  const draft = row.status === "draft";
  async function toggle(key) {
    const enabled = !current.includes(key);
    const apply = (on) => (item) => ({
      ...item,
      placements: catalog
        .map((placement) => placement.key)
        .filter((k) => (k === key ? on : (item.placements || []).includes(k)))
    });
    onChange(apply(enabled));
    try {
      await crmFetch(entityApi(entity, row[entityPk(entity)]), {
        method: "PATCH",
        body: { placement: key, enabled }
      });
    } catch (error) {
      onChange(apply(!enabled));
      toast.error(error.message);
    }
  }
  return (
    <div
      role="group"
      aria-label="Show on"
      title={draft ? "Draft: hidden everywhere until published" : undefined}
      className={classNames("flex flex-wrap gap-1.5", draft && "opacity-60", className)}
    >
      {catalog.map((placement) => {
        const on = current.includes(placement.key);
        return (
          <button
            key={placement.key}
            type="button"
            aria-pressed={on}
            title={`${on ? "Shown on" : "Not on"}: ${placement.hint}`}
            onClick={() => toggle(placement.key)}
            className={classNames(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pmred",
              on
                ? "border-pmred bg-pmred text-white hover:bg-pmred-dark"
                : "border-neutral-200 bg-white text-neutral-400 hover:border-pmred hover:text-pmred"
            )}
          >
            {on ? <CheckIcon className="h-3 w-3" /> : <PlusIcon className="h-3 w-3" />}
            {placement.label}
          </button>
        );
      })}
    </div>
  );
}

// Published/draft (visible/hidden, active/suspended) switch, or a select for entities
// with more states (inbox). Optimistic like the chips.
export function StatusToggle({ entity, row, onChange }) {
  const def = ENTITIES[entity];
  const [busy, setBusy] = useState(false);
  if (def.readonlyEntity) return <StatusBadge value={row.status} />;
  const statuses = def.statuses;
  async function setStatus(next) {
    const previous = row.status;
    if (next === previous) return;
    onChange((item) => ({ ...item, status: next }));
    setBusy(true);
    try {
      const { row: saved } = await crmFetch(entityApi(entity, row[entityPk(entity)]), {
        method: "PATCH",
        body: { status: next }
      });
      onChange((item) => ({ ...item, ...saved }));
      if (entity === "inbox") notifyBadges();
    } catch (error) {
      onChange((item) => ({ ...item, status: previous }));
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (statuses.length > 2) {
    return (
      <select
        value={row.status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Status"
        className="h-8 cursor-pointer rounded-full border border-neutral-200 bg-white px-3 text-2xs font-bold uppercase tracking-wider focus:border-pmred focus:outline-none"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    );
  }
  const on = row.status === statuses[0].value;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${statuses[0].label} (${on ? "on" : "off"})`}
      disabled={busy}
      onClick={() => setStatus(on ? statuses[1].value : statuses[0].value)}
      title={
        on
          ? `Click to set ${statuses[1].label.toLowerCase()}`
          : `Click to set ${statuses[0].label.toLowerCase()}`
      }
      className={classNames(
        "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-2xs font-bold uppercase tracking-wider transition-colors",
        on
          ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
          : "border-neutral-200 bg-neutral-50 text-neutral-500"
      )}
    >
      <span
        className={classNames(
          "relative block h-4 w-7 shrink-0 rounded-full transition-colors",
          on ? "bg-emerald-600" : "bg-neutral-300"
        )}
        aria-hidden="true"
      >
        <span
          className={classNames(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left]",
            on ? "left-3.5" : "left-0.5"
          )}
        />
      </span>
      {on ? statuses[0].label : statuses[1].label}
    </button>
  );
}

// One-line summary under a row's title.
export function describeRow(entity, row) {
  const parts = (...items) => items.filter((item) => item || item === 0).join(" · ");
  switch (entity) {
    case "artists":
      return parts(
        row.location,
        row.album_count !== undefined &&
          `${row.album_count} albums · ${row.video_count} videos · ${row.event_count} events · ${row.product_count} merch`
      );
    case "albums":
      return parts(
        row.artist_label || row.artist_name,
        row.album_type,
        row.release_date && formatDay(row.release_date),
        row.track_count !== undefined && `${row.track_count} tracks`
      );
    case "videos":
      return parts(
        row.artist_label || row.artist_name,
        row.duration ? toMmSs(row.duration) : null,
        `${formatCount(row.views)} views`
      );
    case "events":
      return parts(
        formatDateTime(row.starts_at, row.time_zone),
        [row.venue, row.city].filter(Boolean).join(", "),
        row.lineup_names?.length ? row.lineup_names.join(", ") : null
      );
    case "products":
      return parts(
        row.category_label || row.category,
        row.kind,
        row.price !== null && row.price !== undefined ? formatMoney(row.price) : null,
        row.credits !== null && row.credits !== undefined ? `₵${formatCount(row.credits)}` : null,
        row.artist_label
      );
    case "product_categories":
      return parts(
        row.slug,
        row.icon,
        row.product_count !== undefined && `${row.product_count} products`
      );
    case "photo_categories":
      return parts(row.photo_count !== undefined && `${row.photo_count} photos`, row.description);
    case "photos":
      return parts(row.category_label, row.artist_label, row.location);
    case "posts":
      return parts(row.section, formatDay(row.published_on), row.artist_label, row.author);
    case "social_networks":
      return parts(
        row.handle,
        `${formatCount(row.followers)} followers`,
        row.post_count !== undefined && `${row.post_count} posts`
      );
    case "social_posts":
      return parts(
        row.network_label || row.network_id,
        row.kind,
        formatDay(row.posted_on),
        row.title && row.body?.slice(0, 60)
      );
    case "comments":
      return parts(
        row.author_name,
        threadLabel(row),
        timeAgo(row.created_at),
        `${row.likes} likes`
      );
    case "members":
      return parts(
        `@${row.username}`,
        row.email,
        `₵${formatCount(row.credits)}`,
        `joined ${formatDay(row.created_at)}`
      );
    case "orders":
      return parts(
        row.items?.length
          ? `${row.items[0].name || row.items[0].id}${row.items.length > 1 ? ` +${row.items.length - 1} more` : ""}`
          : null,
        row.member_name || row.username || "Deleted member",
        row.method,
        row.method === "credits"
          ? `₵${formatCount(row.total_credits)}`
          : formatMoney(row.total_usd),
        formatDateTime(row.created_at)
      );
    case "inbox":
      return parts(row.kind, row.name, row.email, timeAgo(row.created_at));
    default:
      return "";
  }
}

export function editHref(entity, row) {
  const id = row[entityPk(entity)];
  return entity === "artists" ? `/crm/artists/${encodeURIComponent(id)}` : crmPath(entity, id);
}

const ICON_LINK =
  "flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-pmred";

// A content row: thumbnail, title, summary, status switch, placement chips, and
// Edit / View on site / Delete. Used by every list and the artist hub.
export default function ContentRow({ entity, row, onChange, onDelete, children, grid = false }) {
  const def = ENTITIES[entity];
  const title = rowTitle(entity, row);
  const href = editHref(entity, row);
  const publicHref = publicPathFor(entity, row);
  const summary = describeRow(entity, row);
  // Comments: the raw thread id stays available on hover.
  const summaryTitle = entity === "comments" ? row.thread_id : undefined;
  const shape = def.thumbShape || "square";
  const hasThumb = Boolean(def.thumbField);
  const actions = (
    <div className="flex shrink-0 items-center">
      <Link href={href} className={ICON_LINK} aria-label={`Edit ${title}`} title="Edit">
        <PencilSquareIcon className="h-4 w-4" />
      </Link>
      {publicHref && row.status !== "draft" && (
        <a
          href={publicHref}
          target="_blank"
          rel="noreferrer"
          className={ICON_LINK}
          aria-label={`View ${title} on the site`}
          title="View on site"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(row)}
          className={ICON_LINK}
          aria-label={`Delete ${title}`}
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (grid) {
    return (
      <li className="flex flex-col border border-neutral-200 bg-white">
        <Link href={href} className="group block" aria-label={`Edit ${title}`}>
          <Thumb
            src={rowThumb(entity, row)}
            shape={shape === "wide" ? "wide" : "square"}
            className="w-full transition group-hover:opacity-90"
          />
        </Link>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="min-w-0">
            <Link href={href} className="line-clamp-2 text-sm font-bold leading-5 hover:text-pmred">
              {title}
            </Link>
            {summary && (
              <p title={summaryTitle} className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                {summary}
              </p>
            )}
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <StatusToggle entity={entity} row={row} onChange={onChange} />
            {actions}
          </div>
          <PlacementChips entity={entity} row={row} onChange={onChange} />
          {children}
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 transition hover:bg-neutral-50 md:flex-row md:items-center">
      <Link href={href} className="group flex min-w-0 flex-1 items-center gap-4">
        {hasThumb && (
          <Thumb
            src={rowThumb(entity, row)}
            shape={shape}
            className={shape === "wide" ? "w-24" : "w-14"}
          />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold group-hover:text-pmred">{title}</span>
          {summary && (
            <span title={summaryTitle} className="block truncate text-xs text-neutral-500">
              {summary}
            </span>
          )}
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <PlacementChips entity={entity} row={row} onChange={onChange} />
        <StatusToggle entity={entity} row={row} onChange={onChange} />
        {children}
        {actions}
      </div>
    </li>
  );
}
