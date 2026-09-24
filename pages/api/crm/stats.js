import { apiHandler, requireAdmin } from "../../../lib/server/http";
import { sql } from "../../../lib/server/db";
import { attachThreadTitles } from "../../../lib/server/crm/threads";

// Dashboard: counts, recent orders, newest members, latest comments, unread inbox and
// the audit log.

// CRM edits and resets; sign-ins (admin or member), sign-ups and form posts go to the
// separate "Site activity" feed.
const CRM_EDIT = `(actor like 'admin:%' or actor = 'system')
  and action not in ('login', 'login_failed', 'logout')`;
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const [[counts], orders, members, comments, inbox, auditLog, siteLog] = await Promise.all([
      sql.query(`select
        (select count(*) from artists)::int as artists,
        (select count(*) from albums)::int as albums,
        (select count(*) from tracks)::int as tracks,
        (select count(*) from videos)::int as videos,
        (select count(*) from events)::int as events,
        (select count(*) from events where starts_at > now())::int as upcoming_events,
        (select count(*) from products)::int as products,
        (select count(*) from photos)::int as photos,
        (select count(*) from posts)::int as posts,
        (select count(*) from social_networks)::int as social_networks,
        (select count(*) from social_posts)::int as social_posts,
        (select count(*) from comments)::int as comments,
        (select count(*) from comments where status = 'hidden')::int as hidden_comments,
        (select count(*) from users)::int as members,
        (select count(*) from users where created_at > now() - interval '7 days')::int as new_members,
        (select count(*) from orders)::int as orders,
        (select coalesce(sum(total_usd), 0) from orders where status = 'completed')::float as revenue_usd,
        (select coalesce(sum(total_credits), 0) from orders where status = 'completed')::int as revenue_credits,
        (select count(*) from inbox where status = 'new')::int as inbox_new,
        (select count(*) from inbox)::int as inbox_total`),
      sql.query(`select o.id, o.method, o.total_usd, o.total_credits, o.status, o.created_at,
        u.name as member_name, u.username from orders o left join users u on u.id = o.user_id
        order by o.created_at desc limit 6`),
      sql.query(`select id::text as id, name, username, avatar_url, credits, created_at from users
        order by created_at desc limit 6`),
      sql.query(`select id, thread_id, author_name, author_avatar, body, status, created_at
        from comments order by created_at desc limit 6`),
      sql.query(`select id, kind, name, email, subject, body, created_at from inbox
        where status = 'new' order by created_at desc limit 6`),
      // CRM edits (and resets) vs. site activity (member sign-ups/logins, form posts,
      // failed logins) — the latter is high-volume, so it gets its own feed.
      sql.query(`select id::text as id, actor, action, entity, entity_id, detail, created_at
        from audit_log where ${CRM_EDIT}
        order by created_at desc, id desc limit 12`),
      sql.query(`select id::text as id, actor, action, entity, entity_id, detail, created_at
        from audit_log where not (${CRM_EDIT})
        order by created_at desc, id desc limit 12`)
    ]);
    await attachThreadTitles(comments);
    res.json({ counts, orders, members, comments, inbox, audit: auditLog, activity: siteLog });
  }
});
