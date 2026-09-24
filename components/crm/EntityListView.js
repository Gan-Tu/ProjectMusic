import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ListBulletIcon, PlusIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
import { PLACEMENTS } from "../../lib/placements";
import { classNames } from "../../lib/format";
import { ENTITIES, crmPath, entityPk, rowTitle } from "./entityDefs";
import {
  crmFetch,
  entityApi,
  invalidateOptions,
  notifyBadges,
  queryString,
  useCrmData,
  useOptions
} from "./api";
import ContentRow from "./ContentRow";
import {
  EmptyState,
  ErrorNote,
  INLINE_SELECT,
  Pagination,
  SearchInput,
  Spinner,
  CrmButton as Button
} from "./ui";

const GRID_ENTITIES = new Set(["albums", "photos", "products", "videos", "artists"]);

// URL names of list filters that would clash with route params (/crm/[section]).
const URL_KEYS = { section: "post_section" };
const urlKey = (key) => URL_KEYS[key] || key;

export async function confirmDelete(entity, row) {
  const def = ENTITIES[entity];
  const title = rowTitle(entity, row);
  if (!window.confirm(`Delete ${def.label.toLowerCase()} "${title}"? This can't be undone.`)) {
    return false;
  }
  try {
    await crmFetch(entityApi(entity, row[entityPk(entity)]), { method: "DELETE" });
    invalidateOptions(entity);
    if (entity === "inbox") notifyBadges();
    toast.success(`${def.label} deleted.`);
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
}

function FilterSelect({ filter, value, onChange, options }) {
  return (
    <select
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      aria-label={filter.label}
      className={classNames(INLINE_SELECT, "min-w-36 max-w-56")}
    >
      <option value="">All {filter.label.toLowerCase()}s</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Generic searchable, filterable, paginated list of one entity with instant status
// and placement toggles. `fixed` filters (e.g. { artist }) are always applied and
// hidden from the toolbar.
export default function EntityListView({
  entity,
  fixed = {},
  createHref,
  pageSize = 50,
  defaultView,
  hideCreate = false,
  emptyText
}) {
  const router = useRouter();
  const def = ENTITIES[entity];
  const pk = entityPk(entity);
  // Filters, search, sort, page and view live in the URL query, so back/refresh keep them.
  const read = (key) => (typeof router.query[key] === "string" ? router.query[key] : "");
  const query = read("q");
  const status = read("status");
  const placement = read("placement");
  const sort = read("sort") || def.sorts?.[0]?.key || "";
  const page = Math.max(1, Number.parseInt(read("page"), 10) || 1);
  const initialView = defaultView || (entity === "photos" ? "grid" : "list");
  const view = read("view") || initialView;
  const visibleFilters = (def.filters || []).filter((filter) => !(filter.key in fixed));
  const filters = Object.fromEntries(
    visibleFilters
      .map((filter) => [filter.key, read(urlKey(filter.key))])
      .filter(([, value]) => value)
  );

  function setParams(changes) {
    const next = { ...router.query };
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === null || value === "") delete next[key];
      else next[key] = String(value);
    }
    router.replace({ pathname: router.pathname, query: next }, undefined, {
      shallow: true,
      scroll: false
    });
  }

  // The search box is local while typing and lands in ?q= after a pause; a ?q= change
  // that didn't come from typing (back/forward) is copied into the box.
  const [search, setSearch] = useState(query);
  const [shownQuery, setShownQuery] = useState(query);
  const [typedQuery, setTypedQuery] = useState(null);
  if (query !== shownQuery) {
    setShownQuery(query);
    if (query !== typedQuery) setSearch(query);
  }
  useEffect(() => {
    const term = search.trim();
    if (term === query) return undefined;
    const timer = setTimeout(() => {
      setTypedQuery(term);
      const next = { ...router.query, q: term };
      if (!term) delete next.q;
      delete next.page;
      router.replace({ pathname: router.pathname, query: next }, undefined, {
        shallow: true,
        scroll: false
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, query, router]);

  const refTypes = visibleFilters.filter((filter) => filter.ref).map((filter) => filter.ref);
  const options = useOptions(refTypes);
  const url =
    entityApi(entity) +
    queryString({ q: query, status, placement, sort, page, pageSize, ...filters, ...fixed });
  const { data, error, loading, setData } = useCrmData(url);
  const rows = data?.rows || [];
  const catalog = PLACEMENTS[def.placements] || [];

  const updateRow = (id) => (updater) =>
    setData((current) =>
      current
        ? { ...current, rows: current.rows.map((row) => (row[pk] === id ? updater(row) : row)) }
        : current
    );
  async function remove(row) {
    if (await confirmDelete(entity, row)) {
      setData((current) => ({
        ...current,
        rows: current.rows.filter((item) => item[pk] !== row[pk]),
        total: current.total - 1
      }));
    }
  }
  const setFilter = (key, value) => setParams({ [urlKey(key)]: value, page: undefined });
  const canCreate = def.canCreate !== false && !hideCreate;
  const grid = view === "grid";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Search ${def.plural.toLowerCase()}…`}
            className="min-w-48 flex-1"
          />
          {canCreate && (
            <Button href={createHref || `${crmPath(entity)}/new`} size="md">
              <PlusIcon className="h-4 w-4" /> New {def.label.toLowerCase()}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => setParams({ status: event.target.value, page: undefined })}
            aria-label="Status"
            className={classNames(INLINE_SELECT, "min-w-32")}
          >
            <option value="">Any status</option>
            {def.statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {catalog.length > 0 && (
            <select
              value={placement}
              onChange={(event) => setParams({ placement: event.target.value, page: undefined })}
              aria-label="Shown on"
              className={classNames(INLINE_SELECT, "min-w-36")}
            >
              <option value="">Shown anywhere</option>
              {catalog.map((option) => (
                <option key={option.key} value={option.key}>
                  On {option.label}
                </option>
              ))}
              <option value="none">Unlisted (no placement)</option>
            </select>
          )}
          {visibleFilters.map((filter) =>
            filter.options || filter.ref ? (
              <FilterSelect
                key={filter.key}
                filter={filter}
                value={filters[filter.key]}
                onChange={(value) => setFilter(filter.key, value)}
                options={filter.options || options[filter.ref] || []}
              />
            ) : null
          )}
          {def.sorts?.length > 1 && (
            <select
              value={sort}
              onChange={(event) =>
                setParams({
                  sort: event.target.value === def.sorts[0].key ? undefined : event.target.value,
                  page: undefined
                })
              }
              aria-label="Sort"
              className={classNames(INLINE_SELECT, "min-w-36")}
            >
              {def.sorts.map((option) => (
                <option key={option.key} value={option.key}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          )}
          {GRID_ENTITIES.has(entity) && (
            <div className="ml-auto flex items-center gap-1" role="group" aria-label="View">
              {[
                ["list", ListBulletIcon],
                ["grid", Squares2X2Icon]
              ].map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  aria-label={`${key} view`}
                  onClick={() => setParams({ view: key === initialView ? undefined : key })}
                  className={classNames(
                    "flex h-10 w-10 items-center justify-center rounded-full transition sm:h-9 sm:w-9",
                    view === key ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-pmred"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {loading && !data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title={`No ${def.plural.toLowerCase()} found`}>
          {emptyText || (query || status || placement ? "Try other filters." : null)}
        </EmptyState>
      ) : (
        <div className={classNames(loading && "opacity-60 transition-opacity")}>
          <p
            className="mb-2 text-2xs font-bold uppercase tracking-widest text-neutral-500"
            aria-live="polite"
          >
            {data.total}{" "}
            {data.total === 1 ? def.label.toLowerCase() : def.noun || def.plural.toLowerCase()}
          </p>
          <ul
            className={
              grid
                ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                : "divide-y divide-neutral-100 border border-neutral-200 bg-white"
            }
          >
            {rows.map((row) => (
              <ContentRow
                key={row[pk]}
                entity={entity}
                row={row}
                grid={grid}
                onChange={updateRow(row[pk])}
                onDelete={def.readonlyEntity || entity === "members" ? undefined : remove}
              />
            ))}
          </ul>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={(next) => {
              setParams({ page: next > 1 ? next : undefined });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
