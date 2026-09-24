import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/20/solid";
import { Toggle } from "../ui/Form";
import { PLACEMENTS } from "../../lib/placements";
import { classNames } from "../../lib/format";
import { ENTITIES } from "./entityDefs";
import { useOptions } from "./api";
import { ImagePreview, AudioPreview, VideoPreview } from "./MediaPreview";
import { CONTROL, Thumb, INPUT, SELECT, TEXTAREA, LABEL, textareaClass } from "./ui";
import {
  URL_HINT,
  formatDateTime,
  fromMmSs,
  isValidUrlInput,
  isoToZonedInput,
  timeZoneList,
  toMmSs,
  zonedInputToIso
} from "./format";

const SMALL_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-pmred hover:text-pmred disabled:cursor-not-allowed disabled:opacity-30";
const ADD_BUTTON =
  "inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-neutral-300 px-4 py-1.5 text-2xs font-bold uppercase tracking-wider text-neutral-500 transition hover:border-pmred hover:text-pmred";

function move(list, index, delta) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function RowControls({ index, count, onMove, onRemove, label }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className={SMALL_BUTTON}
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
      >
        <ArrowUpIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={SMALL_BUTTON}
        onClick={() => onMove(index, 1)}
        disabled={index === count - 1}
        aria-label={`Move ${label} down`}
      >
        <ArrowDownIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={SMALL_BUTTON}
        onClick={() => onRemove(index)}
        aria-label={`Remove ${label}`}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// Plain text + inputMode="url": type="url" would reject the site paths ("/shop/…")
// that seeded rows use. Validated like the server does.
function urlInputClass(value) {
  return classNames(
    CONTROL,
    "h-10 w-full px-4 text-sm",
    isValidUrlInput(value) ? "border-neutral-200" : "border-pmred"
  );
}

function UrlInput({ id, value, onChange, placeholder, required }) {
  const invalid = !isValidUrlInput(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || "https://… or /path"}
          required={required}
          aria-invalid={invalid || undefined}
          className={urlInputClass(value)}
        />
        {value && /^(https?:)?\/\//.test(value) && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className={SMALL_BUTTON}
            aria-label="Open link in a new tab"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        )}
      </div>
      {invalid && <span className="text-xs text-pmred">{URL_HINT}</span>}
    </div>
  );
}

function DurationInput({ id, value, onChange }) {
  const [text, setText] = useState(null);
  const shown = text ?? toMmSs(value);
  const invalid = text !== null && fromMmSs(text) === null;
  return (
    <>
      <input
        id={id}
        value={shown}
        inputMode="numeric"
        placeholder="3:30"
        onChange={(event) => {
          setText(event.target.value);
          const seconds = fromMmSs(event.target.value);
          if (seconds !== null) onChange(seconds);
        }}
        onBlur={() => !invalid && setText(null)}
        aria-invalid={invalid || undefined}
        className={classNames(
          CONTROL,
          "h-10 w-full px-4 text-sm",
          invalid ? "border-pmred" : "border-neutral-200"
        )}
      />
      {invalid && <span className="text-xs text-pmred">Use minutes:seconds, e.g. 3:45.</span>}
    </>
  );
}

function TagsInput({ id, value, onChange, placeholder }) {
  const [text, setText] = useState("");
  const tags = Array.isArray(value) ? value : [];
  function add(raw) {
    const items = raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && !tags.includes(item));
    if (items.length) onChange([...tags, ...items]);
    setText("");
  }
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-3xl border border-neutral-200 bg-white px-3 py-1.5 focus-within:border-pmred focus-within:ring-2 focus-within:ring-pmred/15">
      {tags.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-neutral-900 py-0.5 pl-3 pr-1 text-xs font-medium text-white"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((_, i) => i !== index))}
            aria-label={`Remove ${tag}`}
            className="rounded-full p-0.5 text-white/70 hover:text-white"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(text);
          } else if (event.key === "Backspace" && !text && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => text.trim() && add(text)}
        placeholder={tags.length ? "Add…" : placeholder || "Type and press Enter"}
        className="h-7 min-w-24 flex-1 bg-transparent text-sm focus:outline-none"
      />
    </div>
  );
}

function ImagesInput({ id, value, onChange }) {
  const images = Array.isArray(value) ? value : [];
  const update = (index, next) => onChange(images.map((item, i) => (i === index ? next : item)));
  return (
    <div className="flex flex-col gap-3">
      {images.map((src, index) => (
        <div key={index} className="flex items-center gap-3">
          <Thumb src={src} className="w-14" />
          <input
            id={index === 0 ? id : undefined}
            type="text"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            value={src}
            onChange={(event) => update(index, event.target.value)}
            placeholder="https://… or /path"
            aria-label={`Image ${index + 1} URL`}
            aria-invalid={!isValidUrlInput(src) || undefined}
            title={isValidUrlInput(src) ? undefined : URL_HINT}
            className={urlInputClass(src)}
          />
          <RowControls
            index={index}
            count={images.length}
            label={`image ${index + 1}`}
            onMove={(i, delta) => onChange(move(images, i, delta))}
            onRemove={(i) => onChange(images.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button type="button" className={ADD_BUTTON} onClick={() => onChange([...images, ""])}>
        <PlusIcon className="h-4 w-4" /> Add image
      </button>
    </div>
  );
}

function ParagraphsInput({ id, value, onChange }) {
  const paragraphs = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((text, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            id={index === 0 ? id : undefined}
            value={text}
            rows={3}
            onChange={(event) =>
              onChange(paragraphs.map((item, i) => (i === index ? event.target.value : item)))
            }
            aria-label={`Paragraph ${index + 1}`}
            className={TEXTAREA}
          />
          <RowControls
            index={index}
            count={paragraphs.length}
            label={`paragraph ${index + 1}`}
            onMove={(i, delta) => onChange(move(paragraphs, i, delta))}
            onRemove={(i) => onChange(paragraphs.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button type="button" className={ADD_BUTTON} onClick={() => onChange([...paragraphs, ""])}>
        <PlusIcon className="h-4 w-4" /> Add paragraph
      </button>
    </div>
  );
}

function ListInput({ field, value, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const update = (index, key, next) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: next } : row)));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-end"
        >
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
            {field.columns.map((column) => (
              <label key={column.key} className="flex min-w-0 flex-col gap-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400">
                  {column.label}
                </span>
                <input
                  type={column.type === "money" || column.type === "int" ? "number" : "text"}
                  step={column.type === "money" ? "0.01" : column.type === "int" ? "1" : undefined}
                  min={column.type ? 0 : undefined}
                  value={row[column.key] ?? ""}
                  placeholder={column.placeholder}
                  onChange={(event) =>
                    update(
                      index,
                      column.key,
                      column.type && event.target.value !== ""
                        ? Number(event.target.value)
                        : event.target.value
                    )
                  }
                  className={classNames(CONTROL, "h-9 w-full border-neutral-200 px-3 text-sm")}
                />
              </label>
            ))}
          </div>
          <RowControls
            index={index}
            count={rows.length}
            label={`row ${index + 1}`}
            onMove={(i, delta) => onChange(move(rows, i, delta))}
            onRemove={(i) => onChange(rows.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button type="button" className={ADD_BUTTON} onClick={() => onChange([...rows, {}])}>
        <PlusIcon className="h-4 w-4" /> Add {field.label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}

function MapInput({ field, value, onChange }) {
  // Kept as [key, url] pairs while editing so renaming a key doesn't reorder rows.
  const [pairs, setPairs] = useState(() => Object.entries(value || {}));
  const commit = (next) => {
    setPairs(next);
    onChange(Object.fromEntries(next.filter(([key]) => key.trim())));
  };
  const listId = `${field.name}-keys`;
  return (
    <div className="flex flex-col gap-3">
      <datalist id={listId}>
        {(field.keys || []).map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      {pairs.map(([key, link], index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            list={listId}
            value={key}
            onChange={(event) =>
              commit(pairs.map((pair, i) => (i === index ? [event.target.value, pair[1]] : pair)))
            }
            placeholder="website"
            aria-label="Link name"
            className={classNames(CONTROL, "h-10 w-full border-neutral-200 px-4 text-sm sm:w-40")}
          />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!isValidUrlInput(link) || undefined}
              title={isValidUrlInput(link) ? undefined : URL_HINT}
              value={link}
              onChange={(event) =>
                commit(pairs.map((pair, i) => (i === index ? [pair[0], event.target.value] : pair)))
              }
              placeholder="https://…"
              aria-label={`${key || "Link"} URL`}
              className={urlInputClass(link)}
            />
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() => commit(pairs.filter((_, i) => i !== index))}
              aria-label={`Remove ${key || "link"}`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className={ADD_BUTTON}
        onClick={() => {
          const used = new Set(pairs.map(([key]) => key));
          const suggestion = (field.keys || []).find((key) => !used.has(key)) || "";
          setPairs([...pairs, [suggestion, ""]]);
        }}
      >
        <PlusIcon className="h-4 w-4" /> Add link
      </button>
    </div>
  );
}

function JsonInput({ id, value, onChange, rows = 10 }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [error, setError] = useState(null);
  return (
    <>
      <textarea
        id={id}
        value={text}
        rows={rows}
        spellCheck={false}
        onChange={(event) => {
          setText(event.target.value);
          try {
            onChange(JSON.parse(event.target.value));
            setError(null);
          } catch (parseError) {
            setError(parseError.message);
          }
        }}
        aria-invalid={Boolean(error) || undefined}
        className={textareaClass({ invalid: Boolean(error), mono: true })}
      />
      {error && <span className="text-xs text-pmred">Invalid JSON: {error}</span>}
    </>
  );
}

export function PlacementToggles({ entity, value, onChange }) {
  const catalog = PLACEMENTS[ENTITIES[entity]?.placements] || [];
  const current = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-col gap-2">
      {catalog.map((placement) => {
        const on = current.includes(placement.key);
        return (
          <button
            key={placement.key}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                catalog
                  .map((item) => item.key)
                  .filter((key) => (key === placement.key ? !on : current.includes(key)))
              )
            }
            className={classNames(
              "flex items-start gap-3 border px-3 py-2 text-left transition",
              on ? "border-pmred bg-pmred/5" : "border-neutral-200 hover:border-neutral-400"
            )}
          >
            <span
              className={classNames(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                on ? "border-pmred bg-pmred text-white" : "border-neutral-300"
              )}
            >
              {on && <CheckIcon className="h-3 w-3" />}
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider">
                {placement.label}
              </span>
              <span className="block text-xs text-neutral-500">{placement.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReadonlyValue({ field, value }) {
  let shown;
  if (value === null || value === undefined || value === "") shown = "—";
  else if (field.type === "datetime") shown = formatDateTime(value);
  else if (field.type === "bool") shown = value ? "Yes" : "No";
  else if (field.type === "json") {
    return (
      <pre className="max-h-80 overflow-auto border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  } else shown = String(value);
  return (
    <p
      className={classNames(
        "min-h-10 whitespace-pre-wrap break-words border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm",
        field.type === "textarea" && "leading-6"
      )}
    >
      {shown}
    </p>
  );
}

function RefSelect({ id, field, value, onChange }) {
  const options = useOptions([field.ref])[field.ref];
  const list = useMemo(() => {
    const items = options || [];
    // Keep an unknown current value selectable (e.g. options still loading).
    return value && !items.some((item) => item.value === value)
      ? [{ value, label: value }, ...items]
      : items;
  }, [options, value]);
  return (
    <select
      id={id}
      value={value || ""}
      onChange={(event) => onChange(event.target.value || null)}
      required={field.required}
      className={SELECT}
    >
      <option value="">{field.required ? "Choose…" : "— None —"}</option>
      {list.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.hint ? ` — ${option.hint}` : ""}
          {option.status === "draft" ? " (draft)" : ""}
        </option>
      ))}
    </select>
  );
}

// One form control for `field`; `values` is the whole row (for previews that need
// sibling fields, e.g. a video's poster or an event's time zone).
export default function FieldInput({ entity, field, value, values, onChange, isNew }) {
  const id = `field-${field.name}`;
  if (field.readonly || (field.createOnly && !isNew)) {
    return <ReadonlyValue field={field} value={value} />;
  }
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          value={value ?? ""}
          rows={field.rows || 5}
          maxLength={field.max}
          onChange={(event) => onChange(event.target.value)}
          className={TEXTAREA}
        />
      );
    case "image":
    case "audio":
    case "video":
    case "link":
      return (
        <div className="flex flex-col gap-3">
          <UrlInput id={id} value={value} onChange={onChange} required={field.required} />
          {field.type === "image" && <ImagePreview src={value} />}
          {field.type === "audio" && <AudioPreview src={value} />}
          {field.type === "video" && (
            <VideoPreview src={value} poster={values?.poster_url} captions={values?.captions_url} />
          )}
        </div>
      );
    case "int":
    case "money":
      return (
        <input
          id={id}
          type="number"
          step={field.type === "money" ? "0.01" : "1"}
          min={field.min ?? (field.type === "money" ? 0 : undefined)}
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? (field.nullable ? null : "") : event.target.value)
          }
          className={INPUT}
        />
      );
    case "duration":
      return <DurationInput id={id} value={value} onChange={onChange} />;
    case "bool":
      return (
        <div className="flex h-10 items-center gap-3">
          <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />
          <span className="text-xs text-neutral-500">{value ? "Yes" : "No"}</span>
        </div>
      );
    case "date":
      return (
        <input
          id={id}
          type="date"
          value={value || ""}
          onChange={(event) => onChange(event.target.value || (field.nullable ? null : ""))}
          className={INPUT}
        />
      );
    case "datetime": {
      const zone = values?.[field.tzField] || "UTC";
      return (
        <>
          <input
            id={id}
            type="datetime-local"
            value={isoToZonedInput(value, zone)}
            onChange={(event) => onChange(zonedInputToIso(event.target.value, zone))}
            required={field.required}
            className={INPUT}
          />
          {value && (
            <span className="text-xs text-neutral-500">
              {formatDateTime(value, zone)} · stored as {new Date(value).toISOString().slice(0, 16)}
              Z
            </span>
          )}
        </>
      );
    }
    case "timezone":
      return (
        <select
          id={id}
          value={value || "UTC"}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT}
        >
          {timeZoneList().map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      );
    case "enum":
      return (
        <select
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "status": {
      const statuses = ENTITIES[entity].statuses;
      return (
        <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const active = value === status.value;
            return (
              <button
                key={status.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(status.value)}
                className={classNames(
                  "rounded-full border px-4 py-1.5 text-2xs font-bold uppercase tracking-wider transition-colors",
                  active
                    ? status.value === statuses[0].value
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "ref":
      return <RefSelect id={id} field={field} value={value} onChange={onChange} />;
    case "tags":
      return (
        <TagsInput id={id} value={value} onChange={onChange} placeholder={field.placeholder} />
      );
    case "images":
      return <ImagesInput id={id} value={value} onChange={onChange} />;
    case "paragraphs":
      return <ParagraphsInput id={id} value={value} onChange={onChange} />;
    case "list":
      return <ListInput field={field} value={value} onChange={onChange} />;
    case "map":
      return <MapInput field={field} value={value} onChange={onChange} />;
    case "json":
      return <JsonInput id={id} value={value} onChange={onChange} />;
    case "placements":
      return <PlacementToggles entity={entity} value={value} onChange={onChange} />;
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000"}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${field.label} picker`}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-full border border-neutral-200 bg-white p-1"
          />
          <input
            id={id}
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            className={INPUT}
          />
        </div>
      );
    case "slug":
      return (
        <input
          id={id}
          value={value || ""}
          onChange={(event) =>
            onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
          }
          placeholder="auto"
          maxLength={80}
          className={classNames(CONTROL, "h-10 w-full border-neutral-200 px-4 font-mono text-xs")}
        />
      );
    default:
      return (
        <input
          id={id}
          value={value ?? ""}
          maxLength={field.max}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          className={INPUT}
        />
      );
  }
}

export { LABEL };
