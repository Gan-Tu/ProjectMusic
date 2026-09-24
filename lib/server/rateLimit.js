import { sql } from "./db";
import { HttpError } from "./http";

// Fixed-window throttles backed by the `rate_limits` table. Each call reserves a slot
// with one atomic upsert *before* the protected work runs, so a burst of concurrent
// requests can't all pass a read-then-write check.
//
//   const slot = await rateLimit(req, res, {
//     key: `login:${clientIp(req)}`, limit: 10, windowSeconds: 900,
//     message: "Too many attempts — try again in a few minutes."
//   });
//   ...on success, when only failures should count: await slot.release();

// The caller's IP: first X-Forwarded-For hop (set by Vercel), else X-Real-IP, else the
// socket address.
export function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return (
    forwarded ||
    String(req.headers["x-real-ip"] || "").trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Reserves one slot for `key` in the current window. Throws HttpError 429 (and sets
// Retry-After) when the limit is exceeded. Returns { count, release }.
export async function rateLimit(req, res, { key, limit, windowSeconds, message }) {
  const [row] = await sql`
    insert into rate_limits (key, window_start, count)
    values (
      ${key},
      to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}),
      1
    )
    on conflict (key, window_start) do update set count = rate_limits.count + 1
    returning count, window_start,
      ceil(extract(epoch from (window_start + make_interval(secs => ${windowSeconds}) - now())))::int
        as retry_after
  `;
  // Old windows are useless; prune now and then.
  if (Math.random() < 0.02) {
    sql`delete from rate_limits where window_start < now() - interval '1 day'`.catch(() => {});
  }
  const release = () =>
    sql`
      update rate_limits set count = greatest(count - 1, 0)
      where key = ${key} and window_start = ${row.window_start}
    `.catch(() => {});
  if (row.count > limit) {
    res.setHeader("Retry-After", String(Math.max(1, row.retry_after)));
    throw new HttpError(429, message || "Too many requests — try again in a few minutes.");
  }
  return { count: row.count, release };
}
