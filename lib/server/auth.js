import crypto from "node:crypto";
import { promisify } from "node:util";
import { sql } from "./db";

// Server-only authentication: member accounts and the single CRM admin.
//
// Sessions live in the `sessions` table. The browser holds a random token in an
// HttpOnly cookie; the database stores only its SHA-256, so a leaked table can't be
// replayed as cookies.

const scrypt = promisify(crypto.scrypt);

export const USER_COOKIE = "pm_session";
export const ADMIN_COOKIE = "pm_admin";
const USER_SESSION_DAYS = 30;
const ADMIN_SESSION_DAYS = 3;

// The one CRM account. Its credentials live only in the environment (Vercel project
// env vars CRM_ADMIN_USERNAME / CRM_ADMIN_PASSWORD; `vercel env pull` for local work) —
// never in the repository. Without both, CRM login is disabled.
export const ADMIN_USERNAME = String(process.env.CRM_ADMIN_USERNAME || "")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.CRM_ADMIN_PASSWORD || "";

// ---------------------------------------------------------------- passwords

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(String(password), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p
  });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, N, r, p, saltB64, hashB64] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(String(password), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p)
  });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export function checkAdminCredentials(username, password) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error("[crm] CRM_ADMIN_USERNAME / CRM_ADMIN_PASSWORD are not set; CRM login is off.");
    return false;
  }
  // Evaluate both so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(
    String(username || "")
      .trim()
      .toLowerCase(),
    ADMIN_USERNAME
  );
  const passOk = safeEqual(String(password || ""), ADMIN_PASSWORD);
  return userOk && passOk;
}

// ---------------------------------------------------------------- cookies

export function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (!key || key in out) continue;
    try {
      out[key] = decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      out[key] = part.slice(index + 1).trim();
    }
  }
  return out;
}

function serializeCookie(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader("Set-Cookie");
  const list = existing ? (Array.isArray(existing) ? existing : [String(existing)]) : [];
  res.setHeader("Set-Cookie", [...list, cookie]);
}

const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ---------------------------------------------------------------- sessions

// Starts a session and sets its cookie. kind: "user" (needs userId) | "admin".
// For a login, pass the `passwordHash` that was just verified: the session is only
// created if the account still has that password and is active, so a login racing a
// password change (which revokes sessions) can't slip a session through. Resolves to
// false (and sets no cookie) when that check fails.
export async function createSession(req, res, { kind, userId = null, passwordHash }) {
  const token = crypto.randomBytes(32).toString("base64url");
  const days = kind === "admin" ? ADMIN_SESSION_DAYS : USER_SESSION_DAYS;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 300);
  if (passwordHash !== undefined) {
    // FOR SHARE waits for an in-flight password reset / suspension on this row, then
    // re-checks the condition against the committed row, so the session can't outlive it.
    const rows = await sql`
      insert into sessions (id, kind, user_id, expires_at, user_agent)
      select ${tokenHash(token)}, ${kind}, u.id, ${expires.toISOString()}, ${userAgent}
      from users u
      where u.id = ${userId} and u.password_hash = ${passwordHash} and u.status = 'active'
      for share of u
      returning id
    `;
    if (!rows.length) return false;
  } else {
    await sql`
      insert into sessions (id, kind, user_id, expires_at, user_agent)
      values (${tokenHash(token)}, ${kind}, ${userId}, ${expires.toISOString()}, ${userAgent})
    `;
  }
  appendSetCookie(
    res,
    serializeCookie(kind === "admin" ? ADMIN_COOKIE : USER_COOKIE, token, days * 86400)
  );
  // Opportunistic cleanup of expired sessions (indexed on expires_at).
  sql`delete from sessions where expires_at < now()`.catch(() => {});
  return true;
}

export async function destroySession(req, res, kind) {
  const name = kind === "admin" ? ADMIN_COOKIE : USER_COOKIE;
  const token = parseCookies(req)[name];
  if (token) await sql`delete from sessions where id = ${tokenHash(token)}`;
  appendSetCookie(res, serializeCookie(name, "", 0));
}

// Ends every session of a member (password change, suspension, deletion).
export async function destroyUserSessions(userId) {
  await sql`delete from sessions where user_id = ${userId}`;
}

// Public member fields (never the password hash).
export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    avatar: row.avatar_url || null,
    location: row.location || "",
    bio: row.bio || "",
    credits: row.credits,
    points: row.points,
    isDemo: Boolean(row.is_demo),
    createdAt: new Date(row.created_at).toISOString()
  };
}

// The logged-in member for this request (active accounts only), or null.
export async function getSessionUser(req) {
  const token = parseCookies(req)[USER_COOKIE];
  if (!token) return null;
  const [row] = await sql`
    select u.* from sessions s join users u on u.id = s.user_id
    where s.id = ${tokenHash(token)} and s.kind = 'user' and s.expires_at > now()
      and u.status = 'active'
  `;
  return row || null;
}

// The CRM admin for this request ({ username }), or null.
export async function getSessionAdmin(req) {
  const token = parseCookies(req)[ADMIN_COOKIE];
  if (!token) return null;
  const [row] = await sql`
    select id from sessions
    where id = ${tokenHash(token)} and kind = 'admin' and expires_at > now()
  `;
  return row ? { username: ADMIN_USERNAME } : null;
}
