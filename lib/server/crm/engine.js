import { sql, withTransaction } from "../db";
import { HttpError, int, slugify, str, url as parseUrl } from "../http";
import { placementKeys } from "../../placements";
import { getEntity } from "./registry";
import { attachThreadTitles } from "./threads";

// Generic CRUD for the CRM. Column names come from the field definitions (never from
// the request); values are always bound parameters. Mutations run in one interactive
// transaction together with their relations and the audit_log row.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const actorOf = (admin) => `admin:${admin?.username || "unknown"}`;

export function requireEntity(key, { allowHidden = false } = {}) {
  const entity = typeof key === "string" ? getEntity(key) : null;
  if (!entity || (entity.hidden && !allowHidden)) throw new HttpError(404, "Unknown entity.");
  return entity;
}

function checkId(entity, id) {
  const text = typeof id === "string" ? id : "";
  if (!text || text.length > 200 || (entity.uuid && !UUID.test(text))) {
    throw new HttpError(404, `${entity.label} not found.`);
  }
  return text;
}

const rowsOf = (client) => async (text, params) => (await client.query(text, params)).rows;

export async function audit(q, admin, action, entity, entityId, detail = {}) {
  await q(
    "insert into audit_log (actor, action, entity, entity_id, detail) values ($1, $2, $3, $4, $5::jsonb)",
    [
      actorOf(admin),
      action,
      entity,
      entityId == null ? null : String(entityId),
      JSON.stringify(detail)
    ]
  );
}

// ---------------------------------------------------------------- input parsing

function isValidTimeZone(zone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function money(value, label, nullable) {
  if (value === undefined || value === null || value === "") return nullable ? null : "0.00";
  const n = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 99999999) {
    throw new HttpError(400, `${label} must be an amount of at least 0.`);
  }
  return n.toFixed(2);
}

function stringList(value, label, { max = 50, itemMax = 200 } = {}) {
  const list = typeof value === "string" ? value.split(",") : value;
  if (!Array.isArray(list)) throw new HttpError(400, `${label} must be a list.`);
  const out = [];
  for (const item of list) {
    const text = str(item, { max: itemMax, field: label });
    if (text && !out.includes(text)) out.push(text);
  }
  if (out.length > max) throw new HttpError(400, `${label}: at most ${max} items.`);
  return out;
}

function listOfObjects(field, value) {
  const label = field.label;
  if (!Array.isArray(value)) throw new HttpError(400, `${label} must be a list.`);
  if (value.length > 100) throw new HttpError(400, `${label}: at most 100 rows.`);
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = {};
    for (const column of field.columns) {
      const raw = item[column.key];
      if (raw === undefined || raw === null || raw === "") continue;
      const name = `${label} → ${column.label}`;
      if (column.type === "money") row[column.key] = Number(money(raw, name, false));
      else if (column.type === "int") row[column.key] = int(raw, { min: 0, field: name });
      else row[column.key] = str(raw, { max: 2000, field: name });
    }
    if (Object.keys(row).length) out.push(row);
  }
  return out;
}

function linkMap(field, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${field.label} must be an object.`);
  }
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(value).slice(0, 40)) {
    const key = str(rawKey, { max: 40, field: `${field.label} name` });
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      throw new HttpError(400, `${field.label}: "${key}" may only use letters, digits, - and _.`);
    }
    const link = parseUrl(rawValue, { field: `${field.label} → ${key}` });
    if (link) out[key] = link;
  }
  return out;
}

// Returns the column value, or undefined to leave the column untouched.
export function parseField(entity, field, value) {
  const label = field.label || field.name;
  const empty = value === undefined || value === null || value === "";
  switch (field.type) {
    case "text":
    case "textarea":
    case "color": {
      const text = str(value, {
        max: field.max || 500,
        field: label,
        required: field.required,
        trim: field.type !== "textarea"
      });
      const trimmed = field.type === "textarea" ? text.trim() : text;
      if (field.required && !trimmed) throw new HttpError(400, `${label} is required.`);
      if (field.type === "color" && trimmed && !/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
        throw new HttpError(400, `${label} must be a hex color like #ea053f.`);
      }
      return !trimmed && field.nullable ? null : trimmed;
    }
    case "slug": {
      const text = str(value, { max: 80, field: label }).toLowerCase();
      if (text && !SLUG.test(text)) {
        throw new HttpError(400, `${label} may only contain a–z, 0–9 and single dashes.`);
      }
      return text;
    }
    case "image":
    case "audio":
    case "video":
    case "link": {
      const text = parseUrl(value, { field: label, required: field.required });
      return !text && field.nullable ? null : text;
    }
    case "int":
    case "duration": {
      if (empty) {
        if (field.required) throw new HttpError(400, `${label} is required.`);
        return field.nullable ? null : 0;
      }
      return int(value, {
        min: field.min ?? (field.type === "duration" ? 0 : -2147483648),
        max: field.max ?? 2147483647,
        field: label
      });
    }
    case "money":
      return money(value, label, field.nullable);
    case "bool":
      return value === true || value === "true";
    case "date": {
      if (empty) {
        if (field.required) throw new HttpError(400, `${label} is required.`);
        return field.nullable ? null : undefined;
      }
      const text = str(value, { max: 10, field: label });
      const date = new Date(`${text}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(date.getTime())) {
        throw new HttpError(400, `${label} must be a date (YYYY-MM-DD).`);
      }
      return text;
    }
    case "datetime": {
      if (empty) {
        if (field.required) throw new HttpError(400, `${label} is required.`);
        return field.nullable ? null : undefined;
      }
      const date = new Date(str(value, { max: 40, field: label }));
      if (Number.isNaN(date.getTime())) throw new HttpError(400, `${label} is not a valid date.`);
      return date.toISOString();
    }
    case "timezone": {
      const zone = str(value, { max: 64, field: label }) || "America/Los_Angeles";
      if (!isValidTimeZone(zone)) throw new HttpError(400, `${label}: unknown time zone.`);
      return zone;
    }
    case "enum":
    case "status": {
      const options = field.type === "status" ? entity.statuses : field.options;
      const text = str(value, { max: 40, field: label });
      if (!text && !field.required && field.type === "enum" && field.nullable) return null;
      if (!options.some((option) => option.value === text)) {
        throw new HttpError(
          400,
          `${label} must be one of: ${options.map((o) => o.value).join(", ")}.`
        );
      }
      return text;
    }
    case "ref": {
      const text = str(value, { max: 200, field: label });
      if (!text) {
        if (field.required) throw new HttpError(400, `${label} is required.`);
        return null;
      }
      return text;
    }
    case "tags":
      return stringList(value ?? [], label, { max: 50, itemMax: 100 });
    case "paragraphs": {
      if (!Array.isArray(value)) throw new HttpError(400, `${label} must be a list.`);
      const out = value
        .map((item) => str(item, { max: 20000, field: label, trim: false }).trim())
        .filter(Boolean);
      if (out.length > 300) throw new HttpError(400, `${label}: at most 300 paragraphs.`);
      return out;
    }
    case "images": {
      if (!Array.isArray(value)) throw new HttpError(400, `${label} must be a list.`);
      const out = value.map((item) => parseUrl(item, { field: label })).filter(Boolean);
      if (out.length > 30) throw new HttpError(400, `${label}: at most 30 images.`);
      return out;
    }
    case "list":
      return listOfObjects(field, value ?? []);
    case "map":
      return linkMap(field, value ?? {});
    case "json": {
      const text = JSON.stringify(value ?? null);
      if (text.length > 500000) throw new HttpError(400, `${label} is too large.`);
      return value ?? null;
    }
    case "placements": {
      if (!Array.isArray(value)) throw new HttpError(400, `${label} must be a list.`);
      const allowed = placementKeys(entity.placements);
      return allowed.filter((key) => value.includes(key));
    }
    default:
      throw new HttpError(400, `${label} can't be edited.`);
  }
}

export function parseInput(entity, body, mode) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Send the fields as a JSON object.");
  }
  const values = {};
  for (const field of entity.fields) {
    if (field.readonly || field.virtual) continue;
    if (field.createOnly && mode !== "create") continue;
    if (!Object.hasOwn(body, field.name)) {
      if (mode === "create" && field.required && field.type !== "slug") {
        throw new HttpError(400, `${field.label} is required.`);
      }
      continue;
    }
    const value = parseField(entity, field, body[field.name]);
    if (value !== undefined) values[field.name] = value;
  }
  return values;
}

function toParam(entity, name, value) {
  const field = entity.fieldMap[name];
  if (field && ["list", "map", "json"].includes(field.type)) return JSON.stringify(value);
  return value;
}

function placeholder(entity, name, index) {
  const field = entity.fieldMap[name];
  const cast = field ? entity.cast(field) : null;
  return cast ? `$${index}::${cast}` : `$${index}`;
}

function parseRelations(entity, body) {
  const out = {};
  if (entity.key === "albums" && body.tracks !== undefined) {
    if (!Array.isArray(body.tracks)) throw new HttpError(400, "Tracks must be a list.");
    if (body.tracks.length > 300) throw new HttpError(400, "At most 300 tracks per album.");
    const tracks = requireEntity("tracks", { allowHidden: true });
    out.tracks = body.tracks.map((track, index) => {
      if (!track || typeof track !== "object") throw new HttpError(400, "Invalid track.");
      const values = {};
      for (const name of ["title", "artist_name", "duration", "audio_url", "status"]) {
        const field = {
          ...tracks.fieldMap[name],
          label: `Track ${index + 1}: ${tracks.fieldMap[name].label}`
        };
        const value = parseField(
          tracks,
          field,
          track[name] ?? (name === "status" ? "published" : "")
        );
        if (value !== undefined) values[name] = value;
      }
      if (!values.title) throw new HttpError(400, `Track ${index + 1}: title is required.`);
      values.number = index + 1;
      // Existing ids (any format, e.g. seeded "0A4x…-1") are kept when they belong to
      // this album; anything else becomes a new track.
      const id =
        typeof track.id === "string" && track.id && track.id.length <= 200 ? track.id : null;
      return { id, values };
    });
  }
  for (const [entityKey, name] of [
    ["events", "lineup"],
    ["artists", "rotation"]
  ]) {
    if (entity.key === entityKey && body[name] !== undefined) {
      out[name] = stringList(body[name], name === "lineup" ? "Line-up" : "On rotation", {
        max: 100,
        itemMax: 200
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- ids

async function uniqueValue(q, table, column, base, scope) {
  const root = (base || "item").slice(0, 70).replace(/-+$/, "") || "item";
  const params = [root, `${root}-%`];
  let where = `(${column} = $1 or ${column} like $2)`;
  if (scope) {
    params.push(scope.value);
    where += ` and ${scope.column} = $3`;
  }
  const rows = await q(`select ${column} as v from ${table} where ${where}`, params);
  const taken = new Set(rows.map((row) => row.v));
  if (!taken.has(root)) return root;
  for (let n = 2; ; n += 1) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`;
}

async function assignIds(entity, values, q) {
  const { pk, table } = entity;
  if (entity.key === "posts") {
    if (values.slug) {
      const [taken] = await q("select 1 from posts where section = $1 and slug = $2", [
        values.section,
        values.slug
      ]);
      if (taken)
        throw new HttpError(409, `The slug "${values.slug}" is already used in ${values.section}.`);
    } else {
      values.slug = await uniqueValue(q, "posts", "slug", slugify(values.title) || "post", {
        column: "section",
        value: values.section
      });
    }
    if (values.id) {
      const [taken] = await q("select 1 from posts where id = $1", [values.id]);
      if (taken) throw new HttpError(409, `The id "${values.id}" is already taken.`);
    } else values.id = await uniqueValue(q, "posts", "id", `${values.section}-${values.slug}`);
    return;
  }
  if (values[pk]) {
    const [taken] = await q(`select 1 from ${table} where ${pk} = $1`, [values[pk]]);
    if (taken) throw new HttpError(409, `The id "${values[pk]}" is already taken.`);
    return;
  }
  let base = slugify(entity.idFrom ? values[entity.idFrom] : "").slice(0, 60);
  if (entity.key === "social_posts") base = slugify(`${values.network_id}-${base || "post"}`);
  values[pk] = await uniqueValue(q, table, pk, base || entity.idFallback || entity.key);
}

// ---------------------------------------------------------------- reads

async function loadRelations(entity, row, q) {
  if (!row) return row;
  if (entity.key === "albums") {
    row.tracks = await q(
      `select id, number, title, artist_name, duration, audio_url, status
       from tracks where album_id = $1 order by number, title`,
      [row.id]
    );
  } else if (entity.key === "events") {
    const lineup = await q(
      "select artist_id from event_lineup where event_id = $1 order by position, artist_id",
      [row.id]
    );
    row.lineup = lineup.map((item) => item.artist_id);
  } else if (entity.key === "artists") {
    const rotation = await q(
      "select album_id from artist_rotation where artist_id = $1 order by position, album_id",
      [row.id]
    );
    row.rotation = rotation.map((item) => item.album_id);
  }
  return row;
}

const httpRows = (text, params) => sql.query(text, params);

async function selectRow(entity, id, q) {
  const [row] = await q(
    `select ${entity.select}${entity.extras ? `, ${entity.extras}` : ""}
     from ${entity.table} t ${entity.join || ""}
     where t.${entity.pk} = $1${entity.uuid ? "::uuid" : ""}`,
    [id]
  );
  return loadRelations(entity, row || null, q);
}

export async function getRow(key, id) {
  const entity = requireEntity(key, { allowHidden: true });
  const row = await selectRow(entity, checkId(entity, id), httpRows);
  if (!row) throw new HttpError(404, `${entity.label} not found.`);
  if (entity.key === "comments") await attachThreadTitles([row]);
  return row;
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function listRows(key, query = {}) {
  const entity = requireEntity(key);
  const where = [];
  const params = [];
  const p = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  if (search && entity.search?.length) {
    const ph = p(`%${escapeLike(search)}%`);
    where.push(`(${entity.search.map((column) => `${column}::text ilike ${ph}`).join(" or ")})`);
  }
  if (typeof query.status === "string" && query.status) {
    if (!entity.statuses.some((status) => status.value === query.status)) {
      throw new HttpError(400, "Unknown status filter.");
    }
    where.push(`t.status = ${p(query.status)}`);
  }
  if (typeof query.placement === "string" && query.placement && entity.placements) {
    if (query.placement === "none") where.push("cardinality(t.placements) = 0");
    else if (placementKeys(entity.placements).includes(query.placement)) {
      where.push(`${p(query.placement)} = any(t.placements)`);
    } else throw new HttpError(400, "Unknown placement filter.");
  }
  for (const [name, build] of Object.entries(entity.filters || {})) {
    const value = query[name];
    if (typeof value === "string" && value) where.push(build(p(value.slice(0, 200))));
  }
  if (typeof query.ids === "string" && query.ids) {
    where.push(`t.${entity.pk}::text = any(${p(query.ids.split(",").slice(0, 500))}::text[])`);
  }
  const sorts = entity.sorts || {};
  const sort = sorts[query.sort] || Object.values(sorts)[0] || `t.${entity.pk} asc`;
  const pageSize = Math.min(500, Math.max(1, Number.parseInt(query.pageSize, 10) || 50));
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const from = `from ${entity.table} t ${entity.join || ""}`;
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const [rows, counts] = await Promise.all([
    sql.query(
      `select ${entity.select}${entity.extras ? `, ${entity.extras}` : ""} ${from} ${whereSql}
       order by ${sort}, t.${entity.pk} asc limit ${pageSize} offset ${(page - 1) * pageSize}`,
      params
    ),
    sql.query(`select count(*)::int as total ${from} ${whereSql}`, params)
  ]);
  if (entity.key === "comments") await attachThreadTitles(rows);
  return { rows, total: counts[0]?.total || 0, page, pageSize };
}

// ---------------------------------------------------------------- writes

async function saveRelations(entity, id, relations, q) {
  if (relations.tracks) {
    const existing = new Set(
      (await q("select id from tracks where album_id = $1", [id])).map((row) => row.id)
    );
    const keep = [];
    for (const { id: trackId, values } of relations.tracks) {
      const cols = Object.keys(values);
      const params = cols.map((col) => values[col]);
      if (trackId && existing.has(trackId)) {
        await q(
          `update tracks set ${cols.map((col, i) => `${col} = $${i + 2}`).join(", ")} where id = $1`,
          [trackId, ...params]
        );
        keep.push(trackId);
      } else {
        const newId = await uniqueValue(
          q,
          "tracks",
          "id",
          slugify(`${id}-${values.title}`).slice(0, 70)
        );
        await q(
          `insert into tracks (id, album_id, ${cols.join(", ")})
           values ($1, $2, ${cols.map((_, i) => `$${i + 3}`).join(", ")})`,
          [newId, id, ...params]
        );
        keep.push(newId);
      }
    }
    await q("delete from tracks where album_id = $1 and not (id = any($2::text[]))", [id, keep]);
  }
  if (relations.lineup) {
    await q("delete from event_lineup where event_id = $1", [id]);
    await q(
      `insert into event_lineup (event_id, artist_id, position)
       select $1, x.artist_id, x.ord - 1 from unnest($2::text[]) with ordinality as x(artist_id, ord)`,
      [id, relations.lineup]
    );
  }
  if (relations.rotation) {
    await q("delete from artist_rotation where artist_id = $1", [id]);
    await q(
      `insert into artist_rotation (artist_id, album_id, position)
       select $1, x.album_id, x.ord - 1 from unnest($2::text[]) with ordinality as x(album_id, ord)`,
      [id, relations.rotation]
    );
  }
}

const COMMENTED_SECTIONS = new Set(["news", "blog"]);

// News and blog posts need a title; timeline posts may be text-only.
function checkPostTitle(values, previous) {
  const section = values.section ?? previous?.section;
  const title = values.title ?? previous?.title ?? "";
  if (COMMENTED_SECTIONS.has(section) && !String(title).trim()) {
    throw new HttpError(400, "Title is required for news and blog posts.");
  }
}

function normalizeMember(values) {
  if (values.username !== undefined) {
    values.username = values.username.toLowerCase();
    if (!/^[a-z0-9_.-]{2,40}$/.test(values.username)) {
      throw new HttpError(400, "Username: 2–40 characters (a–z, 0–9, _ . -).");
    }
  }
  if (values.email !== undefined) {
    values.email = values.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      throw new HttpError(400, "Enter a valid email.");
  }
}

export async function createRow(key, body, admin) {
  const entity = requireEntity(key);
  if (entity.canCreate === false)
    throw new HttpError(405, `${entity.plural} can't be created here.`);
  const values = parseInput(entity, body, "create");
  const relations = parseRelations(entity, body);
  if (entity.key === "posts") checkPostTitle(values);
  return withTransaction(async (client) => {
    const q = rowsOf(client);
    await assignIds(entity, values, q);
    const cols = Object.keys(values);
    await q(
      `insert into ${entity.table} (${cols.join(", ")})
       values (${cols.map((col, i) => placeholder(entity, col, i + 1)).join(", ")})`,
      cols.map((col) => toParam(entity, col, values[col]))
    );
    const id = values[entity.pk];
    await saveRelations(entity, id, relations, q);
    const title = values[entity.titleField];
    await audit(q, admin, "create", entity.table, id, {
      title: title ? String(title).slice(0, 120) : undefined
    });
    return selectRow(entity, id, q);
  });
}

// PATCH body: any subset of the fields (plus relations), or { placement, enabled } to
// flip one placement atomically.
export async function updateRow(key, rawId, body, admin) {
  const entity = requireEntity(key);
  if (entity.readonlyEntity) throw new HttpError(405, `${entity.plural} are read-only.`);
  const id = checkId(entity, rawId);
  const toggle = body && typeof body.placement === "string";
  if (toggle && !placementKeys(entity.placements).includes(body.placement)) {
    throw new HttpError(400, "Unknown placement.");
  }
  const values = toggle ? {} : parseInput(entity, body, "update");
  const relations = toggle ? {} : parseRelations(entity, body);
  if (entity.key === "members") normalizeMember(values);
  if (!toggle && !Object.keys(values).length && !Object.keys(relations).length) {
    throw new HttpError(400, "Nothing to update.");
  }
  const result = await withTransaction(async (client) => {
    const q = rowsOf(client);
    const previous = await selectRow(entity, id, q);
    if (!previous) throw new HttpError(404, `${entity.label} not found.`);
    const idSql = `$1${entity.uuid ? "::uuid" : ""}`;
    if (toggle) {
      await q(
        `update ${entity.table} t set placements = array(
           select k from unnest($2::text[]) with ordinality as c(k, o)
           where (k = any(t.placements) and k <> $3) or (k = $3 and $4::boolean) order by o)
         where ${entity.pk} = $1`,
        [id, placementKeys(entity.placements), body.placement, Boolean(body.enabled)]
      );
    } else {
      if (entity.key === "posts") checkPostTitle(values, previous);
      if (entity.key === "posts" && values.slug === "") {
        values.slug = await uniqueValue(
          q,
          "posts",
          "slug",
          slugify(values.title ?? previous.title) || "post",
          { column: "section", value: values.section ?? previous.section }
        );
      }
      const cols = Object.keys(values);
      if (cols.length) {
        await q(
          `update ${entity.table} set ${cols
            .map((col, i) => `${col} = ${placeholder(entity, col, i + 2)}`)
            .join(", ")} where ${entity.pk} = ${idSql}`,
          [id, ...cols.map((col) => toParam(entity, col, values[col]))]
        );
      }
      await saveRelations(entity, id, relations, q);
      // News/blog comment threads are "<section>:<slug>": move them along with the post.
      // (Timeline posts have no threads, so moves to/from the timeline leave them be.)
      if (entity.key === "posts") {
        const section = values.section ?? previous.section;
        const slug = values.slug ?? previous.slug;
        const moved = section !== previous.section || slug !== previous.slug;
        if (moved && COMMENTED_SECTIONS.has(section) && COMMENTED_SECTIONS.has(previous.section)) {
          await q("update comments set thread_id = $2 where thread_id = $1", [
            `${previous.section}:${previous.slug}`,
            `${section}:${slug}`
          ]);
        }
      }
      if (entity.key === "members" && values.status === "suspended") {
        await q("delete from sessions where user_id = $1::uuid", [id]);
      }
    }
    const detail = toggle
      ? { placement: body.placement, enabled: Boolean(body.enabled) }
      : { fields: [...Object.keys(values), ...Object.keys(relations)] };
    await audit(q, admin, toggle ? "placement" : "update", entity.table, id, detail);
    const row = await selectRow(entity, id, q);
    return { row, previous };
  });
  if (entity.key === "comments") await attachThreadTitles([result.row]);
  return result;
}

export async function deleteRow(key, rawId, admin) {
  const entity = requireEntity(key);
  if (entity.readonlyEntity) throw new HttpError(405, `${entity.plural} can't be deleted.`);
  const id = checkId(entity, rawId);
  return withTransaction(async (client) => {
    const q = rowsOf(client);
    const previous = await selectRow(entity, id, q);
    if (!previous) throw new HttpError(404, `${entity.label} not found.`);
    if (entity.key === "product_categories") {
      const [{ n }] = await q("select count(*)::int as n from products where category = $1", [id]);
      if (n) throw new HttpError(409, `Move or delete the ${n} products in this category first.`);
    }
    // Timeline posts belong to the artist; news/blog posts only lose the link.
    if (entity.key === "artists") {
      await q("delete from posts where artist_id = $1 and section = 'timeline'", [id]);
    }
    await q(`delete from ${entity.table} where ${entity.pk} = $1${entity.uuid ? "::uuid" : ""}`, [
      id
    ]);
    await audit(q, admin, "delete", entity.table, id, {
      title: String(previous[entity.titleField] || "").slice(0, 120) || undefined
    });
    return previous;
  });
}

export async function duplicateRow(key, id, admin) {
  const entity = requireEntity(key);
  if (entity.canCreate === false) throw new HttpError(405, `${entity.plural} can't be duplicated.`);
  const row = await getRow(key, id);
  const body = { ...row };
  delete body[entity.pk];
  if (entity.key === "posts") delete body.slug;
  if (entity.titleField && body[entity.titleField])
    body[entity.titleField] = `${body[entity.titleField]} (copy)`;
  if (body.status === "published") body.status = "draft";
  if (row.tracks) body.tracks = row.tracks.map((track) => ({ ...track, id: undefined }));
  return createRow(key, body, admin);
}
