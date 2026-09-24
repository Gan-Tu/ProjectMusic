import { sql } from "../../lib/server/db";
import { getSessionUser } from "../../lib/server/auth";
import { apiHandler, HttpError, makeId, str } from "../../lib/server/http";
import { clientIp, rateLimit } from "../../lib/server/rateLimit";

// POST /api/inbox { kind, name?, email?, subject?, body?, payload?, website? } -> { ok, id }
// Contact messages, feedback and sign-ups (newsletter, text messages, volunteers) for
// the CRM inbox. A logged-in member is attached to what they send.
//
// Spam protection: `website` is a honeypot (a hidden form field people never fill in):
// when it's set, the answer is a success but nothing is stored. Guests may send 5
// messages per 10 minutes per IP, members 20 per account (lib/server/rateLimit.js);
// every accepted message is logged with an "inbox_submit" audit_log row.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOO_MANY =
  "You've sent quite a few messages in a short time. Please wait a few minutes and try again.";

// Required fields per kind ("phone" lives in the payload).
const REQUIRED = {
  contact: ["name", "email", "subject", "body"],
  feedback: ["body"],
  newsletter: ["name", "email"],
  sms: ["name", "phone"],
  volunteer: ["name", "email", "body"]
};

const LABELS = {
  name: "Name",
  email: "Email",
  subject: "Subject",
  body: "Message",
  phone: "Phone"
};

// Extra form fields: a small flat object of text, numbers, booleans or lists of text.
function payloadParam(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "payload must be an object.");
  }
  const entries = Object.entries(value);
  if (entries.length > 20) throw new HttpError(400, "payload has too many fields.");
  const clean = {};
  for (const [key, item] of entries) {
    if (!/^[\w-]{1,40}$/.test(key)) throw new HttpError(400, "payload has an invalid field name.");
    if (Array.isArray(item)) {
      if (item.length > 20) throw new HttpError(400, `${key} has too many values.`);
      clean[key] = item.map((entry) => str(entry, { max: 200, field: key }));
    } else if (typeof item === "boolean" || (typeof item === "number" && Number.isFinite(item))) {
      clean[key] = item;
    } else {
      clean[key] = str(item, { max: 500, field: key });
    }
  }
  return clean;
}

export default apiHandler({
  POST: async (req, res) => {
    const input = req.body || {};
    const kind = typeof input.kind === "string" ? input.kind : "";
    if (!REQUIRED[kind]) throw new HttpError(400, "Unknown message kind.");
    if (input.website) {
      res.status(201).json({ ok: true, id: makeId(kind) }); // honeypot: pretend it worked
      return;
    }
    const fields = {
      name: str(input.name, { max: 100, field: "Name" }),
      email: str(input.email, { max: 200, field: "Email" }).toLowerCase(),
      subject: str(input.subject, { max: 200, field: "Subject" }),
      body: str(input.body, { max: 4000, field: "Message" })
    };
    const payload = payloadParam(input.payload);
    for (const field of REQUIRED[kind]) {
      const value = field === "phone" ? payload.phone : fields[field];
      if (!value) throw new HttpError(400, `${LABELS[field]} is required.`);
    }
    if (fields.email && !EMAIL.test(fields.email)) {
      throw new HttpError(400, "Please enter a valid email address.");
    }
    if (payload.phone && String(payload.phone).replace(/\D/g, "").length < 7) {
      throw new HttpError(400, "Please enter a valid phone number.");
    }
    const user = await getSessionUser(req);
    const ip = clientIp(req).slice(0, 100);
    // A slot is reserved atomically before anything is stored.
    const slot = await rateLimit(req, res, {
      key: user ? `inbox:user:${user.id}` : `inbox:ip:${ip}`,
      limit: user ? 20 : 5,
      windowSeconds: 600,
      message: TOO_MANY
    });
    const id = makeId(kind);
    try {
      await sql.transaction([
        sql`
          insert into inbox (id, kind, user_id, name, email, subject, body, payload)
          values (${id}, ${kind}, ${user?.id || null}, ${fields.name || null},
            ${fields.email || null}, ${fields.subject || null}, ${fields.body || null},
            ${JSON.stringify(payload)}::jsonb)
        `,
        sql`
          insert into audit_log (actor, action, entity, entity_id, detail)
          values (${user ? `user:${user.id}` : "anonymous"}, 'inbox_submit', 'inbox', ${id},
            ${JSON.stringify({ ip, kind })}::jsonb)
        `
      ]);
    } catch (error) {
      await slot.release(); // nothing was stored
      throw error;
    }
    res.status(201).json({ ok: true, id });
  }
});
