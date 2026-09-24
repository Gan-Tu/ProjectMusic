import { useState } from "react";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  InboxIcon,
  ReceiptPercentIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import CrmLayout from "../../components/crm/CrmLayout";
import { useCrmData } from "../../components/crm/api";
import { threadLabel } from "../../components/crm/entityDefs";
import { formatCount, formatMoney, timeAgo } from "../../components/crm/format";
import { Card, ErrorNote, Segmented, Spinner, StatusBadge, Thumb } from "../../components/crm/ui";
import { crmPage } from "../../lib/server/crm/guard";

export const getServerSideProps = crmPage();

function compact(value) {
  const n = Number(value || 0);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

function Tile({ label, value, href, note }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 border border-neutral-200 bg-white p-4 transition hover:border-pmred"
    >
      <span className="text-2xs font-bold uppercase tracking-widest text-neutral-500 group-hover:text-pmred">
        {label}
      </span>
      <span className="text-2xl font-extrabold text-neutral-900">{value}</span>
      {note && <span className="text-xs text-neutral-500">{note}</span>}
    </Link>
  );
}

// Friendly placeholder for a dashboard panel with nothing to show yet.
function PanelEmpty({ icon: Icon, title, children, href, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-xs font-extrabold uppercase tracking-widest text-neutral-700">{title}</p>
      <p className="max-w-xs text-sm leading-6 text-neutral-500">{children}</p>
      {href && (
        <Link
          href={href}
          className="mt-1 text-2xs font-bold uppercase tracking-widest text-pmred-dark hover:underline"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function ListLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-5 py-3 transition hover:bg-neutral-50"
      >
        {children}
      </Link>
    </li>
  );
}

function describeAudit(entry) {
  const detail = entry.detail || {};
  const from = detail.ip ? ` from ${detail.ip}` : "";
  const what = detail.title ? `"${detail.title}"` : entry.entity_id || "";
  switch (entry.action) {
    case "placement":
      return `${detail.enabled ? "Showed" : "Hid"} ${entry.entity} ${entry.entity_id} ${detail.enabled ? "on" : "from"} ${detail.placement}`;
    case "reset":
      return `Reset ${detail.scope || ""} data`;
    case "login":
      return entry.entity === "crm" || entry.actor.startsWith("admin:")
        ? "Signed in to the CRM"
        : `Member signed in${from}`;
    case "login_failed":
      return `Failed ${entry.entity === "users" ? "member" : "CRM"} login${from}`;
    case "signup":
      return `New member sign-up${from}`;
    case "inbox_submit":
      return `New ${detail.kind || String(entry.entity_id || "").split("-")[0] || "inbox"} message`;
    default:
      return `${entry.action.replace(/_/g, " ")} ${entry.entity} ${what}`.trim();
  }
}

function ActivityCard({ audit, activity }) {
  const [feed, setFeed] = useState("crm");
  const entries = feed === "crm" ? audit : activity;
  return (
    <Card
      title="Recent activity"
      actions={
        <Segmented
          label="Activity feed"
          value={feed}
          onChange={setFeed}
          options={[
            { value: "crm", label: "CRM edits" },
            { value: "site", label: "Site activity" }
          ]}
        />
      }
      bodyClassName="p-0"
    >
      {entries.length === 0 ? (
        <p className="p-5 text-sm text-neutral-500">
          {feed === "crm"
            ? "No CRM edits yet."
            : "Sign-ups, member logins and form messages will show up here."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5 text-sm"
            >
              <span className="w-20 shrink-0 text-xs text-neutral-400">
                {timeAgo(entry.created_at)}
              </span>
              <span className="min-w-0 flex-1 first-letter:uppercase">{describeAudit(entry)}</span>
              <span className="truncate text-xs text-neutral-400">{entry.actor}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { data, error } = useCrmData("/api/crm/stats");
  const counts = data?.counts;
  return (
    <CrmLayout title="Dashboard">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data && !error && <Spinner />}
      {data && (
        <div className="flex flex-col gap-6">
          <section
            aria-label="Totals"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"
          >
            <Tile label="Artists" value={compact(counts.artists)} href="/crm/artists" />
            <Tile
              label="Albums"
              value={compact(counts.albums)}
              note={`${formatCount(counts.tracks)} tracks`}
              href="/crm/music"
            />
            <Tile label="Videos" value={compact(counts.videos)} href="/crm/videos" />
            <Tile
              label="Events"
              value={compact(counts.events)}
              note={`${counts.upcoming_events} upcoming`}
              href="/crm/events"
            />
            <Tile label="Products" value={compact(counts.products)} href="/crm/shop" />
            <Tile label="Photos" value={compact(counts.photos)} href="/crm/pictures" />
            <Tile label="Posts" value={compact(counts.posts)} href="/crm/posts" />
            <Tile
              label="Social posts"
              value={compact(counts.social_posts)}
              note={`${counts.social_networks} networks`}
              href="/crm/social-posts"
            />
            <Tile
              label="Comments"
              value={compact(counts.comments)}
              note={`${counts.hidden_comments} hidden`}
              href="/crm/comments"
            />
            <Tile
              label="Members"
              value={compact(counts.members)}
              note={`${counts.new_members} new this week`}
              href="/crm/members"
            />
            <Tile
              label="Orders"
              value={compact(counts.orders)}
              note={`${formatMoney(counts.revenue_usd)} · ₵${compact(counts.revenue_credits)}`}
              href="/crm/orders"
            />
            <Tile label="Unread inbox" value={compact(counts.inbox_new)} href="/crm/inbox" />
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card
              title="Recent orders"
              actions={
                <Link
                  href="/crm/orders"
                  className="text-2xs font-bold uppercase tracking-widest text-pmred-dark hover:underline"
                >
                  All orders
                </Link>
              }
              bodyClassName="p-0"
            >
              {data.orders.length === 0 ? (
                <PanelEmpty icon={ReceiptPercentIcon} title="No orders yet">
                  Purchases of music, merch, tickets and credit packs will appear here as members
                  check out.
                </PanelEmpty>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.orders.map((order) => (
                    <ListLink key={order.id} href={`/crm/orders/${encodeURIComponent(order.id)}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{order.id}</span>
                        <span className="block truncate text-xs text-neutral-500">
                          {order.member_name || "Deleted member"} · {timeAgo(order.created_at)}
                        </span>
                      </span>
                      <span className="text-sm font-bold">
                        {order.method === "credits"
                          ? `₵${formatCount(order.total_credits)}`
                          : formatMoney(order.total_usd)}
                      </span>
                      <StatusBadge value={order.status} />
                    </ListLink>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Newest members"
              actions={
                <Link
                  href="/crm/members"
                  className="text-2xs font-bold uppercase tracking-widest text-pmred-dark hover:underline"
                >
                  All members
                </Link>
              }
              bodyClassName="p-0"
            >
              {data.members.length === 0 ? (
                <PanelEmpty icon={UsersIcon} title="No members yet">
                  New sign-ups show up here, with their credits and orders.
                </PanelEmpty>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.members.map((member) => (
                    <ListLink key={member.id} href={`/crm/members/${member.id}`}>
                      <Thumb src={member.avatar_url} shape="round" className="w-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{member.name}</span>
                        <span className="block truncate text-xs text-neutral-500">
                          @{member.username} · joined {timeAgo(member.created_at)}
                        </span>
                      </span>
                      <span className="text-xs font-bold">₵{formatCount(member.credits)}</span>
                    </ListLink>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Latest comments"
              actions={
                <Link
                  href="/crm/comments"
                  className="text-2xs font-bold uppercase tracking-widest text-pmred-dark hover:underline"
                >
                  Moderate
                </Link>
              }
              bodyClassName="p-0"
            >
              {data.comments.length === 0 ? (
                <PanelEmpty icon={ChatBubbleLeftRightIcon} title="No comments yet">
                  Comments on albums, videos, events and posts land here for moderation.
                </PanelEmpty>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.comments.map((comment) => (
                    <ListLink
                      key={comment.id}
                      href={`/crm/comments/${encodeURIComponent(comment.id)}`}
                    >
                      <Thumb src={comment.author_avatar} shape="round" className="w-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{comment.body}</span>
                        <span className="block truncate text-xs text-neutral-500">
                          {comment.author_name} on{" "}
                          <span title={comment.thread_id}>{threadLabel(comment)}</span> ·{" "}
                          {timeAgo(comment.created_at)}
                        </span>
                      </span>
                      {comment.status === "hidden" && <StatusBadge value="hidden" />}
                    </ListLink>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Unread inbox"
              actions={
                <Link
                  href="/crm/inbox"
                  className="text-2xs font-bold uppercase tracking-widest text-pmred-dark hover:underline"
                >
                  Inbox
                </Link>
              }
              bodyClassName="p-0"
            >
              {data.inbox.length === 0 ? (
                counts.inbox_total === 0 ? (
                  <PanelEmpty icon={InboxIcon} title="The inbox is empty">
                    Contact and feedback messages, newsletter, text and volunteer sign-ups will
                    arrive here.
                  </PanelEmpty>
                ) : (
                  <PanelEmpty
                    icon={InboxIcon}
                    title="All caught up"
                    href="/crm/inbox"
                    action="Open the inbox"
                  >
                    No unread messages — {counts.inbox_total} in the inbox.
                  </PanelEmpty>
                )
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.inbox.map((item) => (
                    <ListLink key={item.id} href={`/crm/inbox/${encodeURIComponent(item.id)}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {item.subject ||
                            `${item.kind} from ${item.name || item.email || "someone"}`}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {item.kind} · {item.email || item.name} · {timeAgo(item.created_at)}
                        </span>
                      </span>
                    </ListLink>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <ActivityCard audit={data.audit} activity={data.activity || []} />
        </div>
      )}
    </CrmLayout>
  );
}
