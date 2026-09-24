import { getSessionAdmin, getSessionUser } from "./auth";

// Helpers for API routes (pages/api/**). Server-only.
//
//   export default apiHandler({
//     GET: async (req, res) => res.json(...),
//     POST: async (req, res) => { const user = await requireUser(req); ... }
//   });
//
// Throw `new HttpError(status, message)` anywhere to answer { error: message }.

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Mutations must come from this site: the browser sends Origin on cross-site POSTs
// (and form posts can't send JSON), so this blocks CSRF alongside SameSite cookies.
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") {
    throw new HttpError(403, "Cross-site request blocked.");
  }
  if (origin) {
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      throw new HttpError(403, "Bad origin.");
    }
    const expected = req.headers["x-forwarded-host"] || req.headers.host;
    if (host !== expected) throw new HttpError(403, "Cross-site request blocked.");
  }
  // Exact media type (parameters like charset allowed). Bodyless DELETEs are fine.
  const type = String(req.headers["content-type"] || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const bodyless = req.method === "DELETE" && !type && !Number(req.headers["content-length"]);
  if (!bodyless && type !== "application/json") {
    throw new HttpError(415, "Send JSON (Content-Type: application/json).");
  }
}

export function apiHandler(methods) {
  return async function handler(req, res) {
    const fn = methods[req.method];
    if (!fn) {
      res.setHeader("Allow", Object.keys(methods).join(", "));
      return res.status(405).json({ error: "Method not allowed." });
    }
    res.setHeader("Cache-Control", "no-store");
    try {
      if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message, ...(error.extra || {}) });
      }
      // Postgres constraint errors -> readable 4xx instead of a 500.
      if (error?.code === "23505") {
        return res.status(409).json({ error: "That id or name is already taken." });
      }
      if (error?.code === "23503") {
        return res.status(409).json({ error: "A linked record is missing or still in use." });
      }
      if (error?.code === "23514" || error?.code === "22P02" || error?.code === "22007") {
        return res.status(400).json({ error: "Some values are not valid." });
      }
      console.error(`[api] ${req.method} ${req.url}`, error);
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong." });
    }
  };
}

export async function requireUser(req) {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "Please log in first.");
  return user;
}

export async function requireAdmin(req) {
  const admin = await getSessionAdmin(req);
  if (!admin) throw new HttpError(401, "CRM login required.");
  return admin;
}

// ---------------------------------------------------------------- input parsing

export function str(value, { max = 500, required = false, field = "value", trim = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${field} is required.`);
    return "";
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new HttpError(400, `${field} must be text.`);
  }
  const text = trim ? String(value).trim() : String(value);
  if (required && !text) throw new HttpError(400, `${field} is required.`);
  if (text.length > max) throw new HttpError(400, `${field} is too long (max ${max}).`);
  return text;
}

export function int(
  value,
  { min = -2147483648, max = 2147483647, field = "value", fallback } = {}
) {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) {
    return fallback;
  }
  // Numbers or numeric strings only (Number() would turn null/false/[] into 0).
  const numeric = typeof value === "number" || (typeof value === "string" && value.trim() !== "");
  const n = numeric ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}.`);
  }
  return n;
}

// http(s) URL or site-relative path ("/shop/x.webp"); empty allowed unless required.
export function url(value, { required = false, field = "URL", max = 2000 } = {}) {
  const text = str(value, { max, required, field });
  if (!text) return "";
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new HttpError(400, `${field} must be a full http(s) URL or a /path.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new HttpError(400, `${field} must start with https:// or http://.`);
  }
  return text;
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
