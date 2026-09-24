import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from "@heroicons/react/20/solid";
import Button from "../ui/Button";
import { classNames } from "../../lib/format";
import { ENTITIES, crmPath, emptyRow, entityPk, publicPathFor, rowTitle } from "./entityDefs";
import { crmFetch, entityApi, invalidateOptions, notifyBadges, useCrmData } from "./api";
import { confirmDelete } from "./EntityListView";
import FieldInput from "./FieldInput";
import TracksEditor from "./TracksEditor";
import OrderedPicker from "./OrderedPicker";
import { formatDateTime } from "./format";
import { Card, ErrorNote, Field, Spinner } from "./ui";

const WIDTHS = { half: "col-span-6 sm:col-span-3", third: "col-span-6 sm:col-span-2" };

// Values for a new row: defaults, then ?field=value from the URL (lists as a,b).
export function prefillRow(entity, query = {}) {
  const row = emptyRow(entity);
  for (const field of ENTITIES[entity].fields) {
    const raw = query[field.name];
    if (typeof raw !== "string" || field.readonly) continue;
    row[field.name] = ["placements", "tags", "images"].includes(field.type)
      ? raw.split(",").filter(Boolean)
      : raw;
  }
  if (entity === "albums") row.tracks = [];
  if (entity === "events")
    row.lineup = typeof query.lineup === "string" ? query.lineup.split(",") : [];
  return row;
}

const subscribeNothing = () => () => {};

function editorPath(entity, id) {
  return entity === "artists" ? `/crm/artists/${encodeURIComponent(id)}` : crmPath(entity, id);
}

// Create / edit form for one row, rendered from the field definitions. `hide` lists
// fields managed elsewhere (e.g. the artist hub header's instant toggles).
export default function EntityEditor({ entity, id, prefill, hide = [], onSaved, children }) {
  const router = useRouter();
  const def = ENTITIES[entity];
  const isNew = id === "new";
  const { data, error, loading } = useCrmData(isNew ? null : entityApi(entity, id));
  // Client-only rendering (time zone lists etc. differ between server and browser).
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
  const [base, setBase] = useState(() => (isNew ? prefillRow(entity, prefill) : null));
  const [values, setValues] = useState(base);
  const [loadedFrom, setLoadedFrom] = useState(null);
  const [saving, setSaving] = useState(false);
  // Bumped whenever the form is reset from outside (load, save, discard) so inputs with
  // local editing state (links, JSON, durations) start over from the new values.
  const [revision, setRevision] = useState(0);

  // Take over freshly loaded data (adjusting state while rendering, not in an effect).
  if (data?.row && data !== loadedFrom) {
    setLoadedFrom(data);
    setBase(data.row);
    setValues(data.row);
    setRevision((n) => n + 1);
  }

  // Opening a new inbox message marks it read.
  const unreadMessage = entity === "inbox" && !isNew && base?.status === "new";
  useEffect(() => {
    if (!unreadMessage) return undefined;
    let alive = true;
    crmFetch(entityApi(entity, id), { method: "PATCH", body: { status: "read" } })
      .then(({ row }) => {
        notifyBadges();
        if (!alive) return;
        setBase(row);
        setValues((current) => ({ ...current, status: row.status }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [unreadMessage, entity, id]);

  const fields = def.fields.filter((field) => !hide.includes(field.name));
  const mainFields = fields.filter((field) => !field.side);
  const sideFields = fields.filter((field) => field.side);
  const dirty = useMemo(
    () => Boolean(values && base && JSON.stringify(values) !== JSON.stringify(base)),
    [values, base]
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(event) {
    event?.preventDefault();
    if (saving || !values) return;
    const payload = {};
    for (const field of fields) {
      if (field.readonly || (field.createOnly && !isNew)) continue;
      payload[field.name] = values[field.name];
    }
    if (entity === "albums") payload.tracks = values.tracks || [];
    if (entity === "events") payload.lineup = values.lineup || [];
    setSaving(true);
    try {
      if (isNew) {
        const { row } = await crmFetch(entityApi(entity), { method: "POST", body: payload });
        invalidateOptions(entity);
        toast.success(`${def.label} created.`);
        setBase(values);
        onSaved?.(row);
        router.replace(editorPath(entity, row[entityPk(entity)]));
      } else {
        const { row } = await crmFetch(entityApi(entity, id), { method: "PATCH", body: payload });
        invalidateOptions(entity);
        setBase(row);
        setValues(row);
        setRevision((n) => n + 1);
        onSaved?.(row);
        if (entity === "inbox") notifyBadges();
        toast.success("Saved.");
      }
    } catch (saveError) {
      toast.error(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.getElementById("crm-editor-form")?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function duplicate() {
    try {
      const { row } = await crmFetch(entityApi(entity, id), {
        method: "POST",
        body: { action: "duplicate" }
      });
      invalidateOptions(entity);
      toast.success("Duplicated as a draft.");
      router.push(editorPath(entity, row[entityPk(entity)]));
    } catch (duplicateError) {
      toast.error(duplicateError.message);
    }
  }

  async function remove() {
    if (await confirmDelete(entity, base)) {
      setBase(values);
      router.push(entity === "artists" ? "/crm/artists" : crmPath(entity));
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!mounted || loading || !values) return <Spinner />;

  const set = (name) => (value) => setValues((current) => ({ ...current, [name]: value }));
  const publicHref = !isNew && values.status !== "draft" ? publicPathFor(entity, base) : null;
  const renderField = (field) => (
    <Field
      key={field.name}
      label={`${field.label}${field.required ? " *" : ""}`}
      htmlFor={`field-${field.name}`}
      help={field.createOnly && !isNew ? undefined : field.help}
      className={WIDTHS[field.width] || "col-span-6"}
    >
      <FieldInput
        key={`${field.name}:${revision}`}
        entity={entity}
        field={field}
        value={values[field.name]}
        values={values}
        onChange={set(field.name)}
        isNew={isNew}
      />
    </Field>
  );

  return (
    <form
      id="crm-editor-form"
      onSubmit={save}
      className={classNames("grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]", dirty && "pb-20")}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Card title={isNew ? `New ${def.label.toLowerCase()}` : "Details"}>
          <div className="grid grid-cols-6 gap-5">{mainFields.map(renderField)}</div>
        </Card>
        {entity === "albums" && (
          <Card title={`Tracks (${values.tracks?.length || 0})`}>
            <TracksEditor value={values.tracks} onChange={set("tracks")} />
          </Card>
        )}
        {entity === "events" && (
          <Card title="Line-up">
            <OrderedPicker
              type="artists"
              value={values.lineup}
              onChange={set("lineup")}
              addLabel="Add an artist to the line-up…"
              emptyText="No artists on the line-up yet."
            />
          </Card>
        )}
        {children}
      </div>
      <aside className="flex flex-col gap-6">
        {sideFields.length > 0 && (
          <Card title="Publishing">
            <div className="grid grid-cols-6 gap-5">{sideFields.map(renderField)}</div>
          </Card>
        )}
        <Card>
          <div className="flex flex-col gap-3">
            {!def.readonlyEntity && (
              <Button type="submit" size="md" disabled={saving || (!dirty && !isNew)}>
                {saving ? "Saving…" : isNew ? `Create ${def.label.toLowerCase()}` : "Save changes"}
              </Button>
            )}
            {publicHref && (
              <Button
                href={publicHref}
                variant="outline"
                size="md"
                target="_blank"
                rel="noreferrer"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" /> View on site
              </Button>
            )}
            {!isNew && def.canCreate !== false && (
              <Button variant="muted" size="md" onClick={duplicate}>
                <DocumentDuplicateIcon className="h-4 w-4" /> Duplicate
              </Button>
            )}
            {!isNew && !def.readonlyEntity && (
              <Button
                variant="muted"
                size="md"
                onClick={remove}
                className="hover:!border-pmred hover:!text-pmred"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </Button>
            )}
            {!isNew && (
              <dl className="mt-2 space-y-1 text-xs text-neutral-500">
                <div className="flex justify-between gap-3">
                  <dt>Id</dt>
                  <dd className="truncate font-mono">{base?.[entityPk(entity)]}</dd>
                </div>
                {base?.created_at && (
                  <div className="flex justify-between gap-3">
                    <dt>Created</dt>
                    <dd>{formatDateTime(base.created_at)}</dd>
                  </div>
                )}
                {base?.updated_at && (
                  <div className="flex justify-between gap-3">
                    <dt>Updated</dt>
                    <dd>{formatDateTime(base.updated_at)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </Card>
      </aside>
      {dirty && !def.readonlyEntity && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 bg-black px-4 py-3 text-white lg:left-64 lg:px-8">
          <p className="truncate text-2xs font-bold uppercase tracking-widest">
            Unsaved changes{isNew ? "" : ` · ${rowTitle(entity, values)}`}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setValues(base);
                setRevision((n) => n + 1);
              }}
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className={classNames(saving && "opacity-60")}
            >
              {saving ? "Saving…" : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
