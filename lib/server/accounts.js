import crypto from "node:crypto";
import { sql } from "./db";
import { HttpError, str } from "./http";

// Server-only helpers for member accounts: input validation and the JSON shapes
// the client reads (orders as "purchases", credit history).

export const DEFAULT_SIGNUP_BONUS = 1000;
const AVATAR_MAX_BYTES = 120 * 1024;

export function parseUsername(value) {
  const username = str(value, { max: 60, required: true, field: "Username" }).toLowerCase();
  if (username.length < 3 || username.length > 30) {
    throw new HttpError(400, "Usernames are 3 to 30 characters long.");
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new HttpError(400, "Usernames can use letters, numbers, dots, dashes and underscores.");
  }
  return username;
}

export function parseEmail(value) {
  const email = str(value, { max: 254, required: true, field: "Email" }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Please enter a valid email address.");
  }
  return email;
}

export function parseName(value) {
  const name = str(value, { max: 80, required: true, field: "Name" }).replace(/\s+/g, " ");
  if (!name) throw new HttpError(400, "Please enter your name.");
  return name;
}

export function parsePassword(value, field = "Password") {
  if (typeof value !== "string") throw new HttpError(400, `${field} is required.`);
  if (value.length < 8) throw new HttpError(400, "Use at least 8 characters for your password.");
  if (value.length > 128) throw new HttpError(400, "Passwords can be at most 128 characters.");
  return value;
}

// An https image URL, or a small uploaded photo as a data: URL (the browser resizes
// uploads to 256px first). Empty clears the avatar.
export function parseAvatar(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new HttpError(400, "The photo must be an image URL.");
  const text = value.trim();
  if (text.startsWith("data:")) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(text);
    if (!match) throw new HttpError(400, "Upload a JPEG, PNG or WebP photo.");
    if (Buffer.byteLength(match[2], "base64") > AVATAR_MAX_BYTES) {
      throw new HttpError(400, "That photo is too large (max 120 KB).");
    }
    return text;
  }
  if (text.length > 2000) throw new HttpError(400, "That image URL is too long.");
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new HttpError(400, "The photo must be a full https:// image URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new HttpError(400, "The photo must be a full https:// image URL.");
  }
  return text;
}

// A readable 409 for a unique index violation on users (a sign-up or rename race).
export function duplicateUserError(error) {
  if (error?.code !== "23505") return null;
  const detail = `${error.constraint || ""} ${error.detail || ""}`;
  if (detail.includes("email")) {
    return new HttpError(409, "An account with that email already exists.");
  }
  return new HttpError(409, "That username is taken. Try another one.");
}

// 409s for a username / email another member already uses.
export async function assertAvailable({ username, email }, exceptId = null) {
  const rows = await sql`
    select username, email from users
    where (username = ${username ?? ""} or email = ${email ?? ""})
      and (${exceptId}::uuid is null or id <> ${exceptId}::uuid)
  `;
  if (username && rows.some((row) => row.username === username)) {
    throw new HttpError(409, "That username is taken. Try another one.");
  }
  if (email && rows.some((row) => row.email === email)) {
    throw new HttpError(409, "An account with that email already exists.");
  }
}

export async function getSignupBonus() {
  try {
    const [row] = await sql`select value from site_settings where key = 'signup_bonus_credits'`;
    const value = Number(row?.value);
    return Number.isInteger(value) && value >= 0 ? value : DEFAULT_SIGNUP_BONUS;
  } catch {
    return DEFAULT_SIGNUP_BONUS;
  }
}

export function newOrderId() {
  const random = crypto
    .randomInt(36 ** 4)
    .toString(36)
    .padStart(4, "0");
  return `PM-${Date.now().toString(36)}${random}`.toUpperCase();
}

// An orders row as the client's purchase shape.
export function orderToPurchase(row) {
  return {
    id: row.id,
    date: new Date(row.created_at).toISOString(),
    method: row.method,
    items: Array.isArray(row.items) ? row.items : [],
    totalUsd: Number(row.total_usd),
    totalCredits: row.total_credits,
    creditsGranted: row.credits_granted,
    pointsEarned: row.points_earned,
    status: row.status
  };
}

export function ledgerEntry(row) {
  return {
    id: String(row.id),
    date: new Date(row.created_at).toISOString(),
    delta: row.delta,
    balanceAfter: row.balance_after,
    reason: row.reason,
    orderId: row.order_id || null,
    note: row.note || ""
  };
}
