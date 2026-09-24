import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { CrmButton as Button } from "../../../components/crm/ui";
import CrmLayout from "../../../components/crm/CrmLayout";
import { crmFetch, useCrmData } from "../../../components/crm/api";
import { formatCount, formatDateTime, formatMoney } from "../../../components/crm/format";
import { Card, ErrorNote, Spinner, StatusBadge, Thumb } from "../../../components/crm/ui";
import { classNames } from "../../../lib/format";
import { crmPage } from "../../../lib/server/crm/guard";

export const getServerSideProps = crmPage(async ({ params }) => ({ props: { id: params.id } }));

const TH = "px-4 py-2 text-left text-2xs font-bold uppercase tracking-widest text-neutral-500";

const KIND_LABELS = {
  merch: "Merch",
  digital: "Digital",
  ticket: "Ticket",
  music: "Music",
  track: "Track",
  album: "Album"
};

// Kind, chosen options, what the purchase unlocks (downloads, passes, credits).
function ItemDetails({ item }) {
  const options = Object.entries(item.options || {})
    .filter(([, value]) => value)
    .map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)}: ${value}`);
  const extras = [
    item.grantsCredits ? `Adds ₵${formatCount(item.grantsCredits)} per unit` : null,
    item.downloads?.length
      ? `${item.downloads.length} download${item.downloads.length === 1 ? "" : "s"}`
      : null,
    item.entitlement?.type === "downloads"
      ? `Download pass · ${item.entitlement.days || "?"} days`
      : item.entitlement
        ? `Grants ${item.entitlement.type}`
        : null,
    item.startsAt ? `Event ${formatDateTime(item.startsAt)}` : null
  ].filter(Boolean);
  if (!item.kind && !options.length && !extras.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {item.kind && (
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white">
          {KIND_LABELS[item.kind] || item.kind}
        </span>
      )}
      {[...options, ...extras].map((text) => (
        <span
          key={text}
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-2xs text-neutral-600"
        >
          {text}
        </span>
      ))}
    </div>
  );
}
const TD = "px-4 py-2.5 align-top";

export default function OrderPage({ id }) {
  const { data, error, reload } = useCrmData(`/api/crm/orders/${encodeURIComponent(id)}`);
  const [busy, setBusy] = useState(false);
  const order = data?.order;

  async function refund() {
    const credits =
      order.method === "credits"
        ? `₵${formatCount(order.total_credits)} goes back to the member. `
        : "";
    const granted = order.credits_granted
      ? `The ₵${formatCount(order.credits_granted)} it granted are taken back. `
      : "";
    if (!window.confirm(`Refund order ${order.id}? ${credits}${granted}`)) return;
    setBusy(true);
    try {
      await crmFetch(`/api/crm/orders/${encodeURIComponent(id)}/refund`, { method: "POST" });
      toast.success("Order refunded.");
      reload();
    } catch (refundError) {
      toast.error(refundError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <CrmLayout title={`Order ${id}`}>
      <Link
        href="/crm/orders"
        className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-neutral-500 transition hover:text-pmred"
      >
        <ArrowLeftIcon className="h-4 w-4" /> All orders
      </Link>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data && !error && <Spinner />}
      {order && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card title={`Items (${(order.items || []).length})`} bodyClassName="overflow-x-auto p-0">
            <table className="w-full text-sm sm:min-w-[36rem]">
              <thead className="border-b border-neutral-100">
                <tr>
                  <th className={TH}>Item</th>
                  <th className={classNames(TH, "text-right max-sm:hidden")}>Qty</th>
                  <th className={classNames(TH, "text-right max-sm:hidden")}>Each</th>
                  <th className={classNames(TH, "text-right max-sm:hidden")}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(order.items || []).map((item, index) => {
                  const qty = Number(item.qty) || 1;
                  const credits = order.method === "credits";
                  const each = credits ? item.credits : item.price;
                  const money = (value) =>
                    value === null || value === undefined
                      ? "—"
                      : credits
                        ? `₵${formatCount(value)}`
                        : formatMoney(value);
                  const total =
                    each === null || each === undefined ? "—" : money(Number(each) * qty);
                  return (
                    <tr key={item.key || `${item.id}-${index}`}>
                      <td className={TD}>
                        <div className="flex items-start gap-3">
                          <Thumb src={item.image} className="w-12" />
                          <div className="min-w-0">
                            <p className="font-bold leading-5">{item.name || item.id || "Item"}</p>
                            {item.subtitle && (
                              <p className="text-xs text-neutral-500">{item.subtitle}</p>
                            )}
                            <ItemDetails item={item} />
                            <p className="mt-1.5 text-xs tabular-nums text-neutral-600 sm:hidden">
                              {qty} × {money(each)} = <strong>{total}</strong>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={classNames(TD, "text-right tabular-nums max-sm:hidden")}>
                        {qty}
                      </td>
                      <td className={classNames(TD, "text-right tabular-nums max-sm:hidden")}>
                        {money(each)}
                      </td>
                      <td
                        className={classNames(
                          TD,
                          "text-right font-bold tabular-nums max-sm:hidden"
                        )}
                      >
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-neutral-200">
                <tr>
                  <td className={TD} colSpan={4}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
                        Charged ({order.method})
                      </span>
                      <span className="font-extrabold tabular-nums">
                        {order.method === "credits"
                          ? `₵${formatCount(order.total_credits)}`
                          : formatMoney(order.total_usd)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            <details className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
              <summary className="cursor-pointer font-bold uppercase tracking-widest">
                Raw items
              </summary>
              <pre className="mt-2 overflow-auto">{JSON.stringify(order.items, null, 2)}</pre>
            </details>
          </Card>
          <div className="flex flex-col gap-6">
            <Card title="Summary">
              <dl className="flex flex-col gap-2 text-sm">
                {[
                  ["Status", <StatusBadge key="s" value={order.status} />],
                  ["Date", formatDateTime(order.created_at)],
                  [
                    "Member",
                    order.user_id ? (
                      <Link
                        key="m"
                        href={`/crm/members/${order.user_id}`}
                        className="font-bold hover:text-pmred"
                      >
                        {order.member_name || order.username || order.user_id}
                      </Link>
                    ) : (
                      "Deleted member"
                    )
                  ],
                  ["Paid with", order.method],
                  ["Total (USD)", formatMoney(order.total_usd)],
                  ["Total credits", `₵${formatCount(order.total_credits)}`],
                  ["Credits granted", `₵${formatCount(order.credits_granted)}`],
                  ["Points earned", formatCount(order.points_earned)]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
                      {label}
                    </dt>
                    <dd className="min-w-0 text-right wrap-anywhere">{value}</dd>
                  </div>
                ))}
              </dl>
              {order.status === "completed" && (
                <Button
                  onClick={refund}
                  disabled={busy}
                  size="md"
                  variant="outline"
                  className="mt-5 w-full"
                >
                  {busy ? "Refunding…" : "Refund order"}
                </Button>
              )}
            </Card>
            <Card title="Credit entries" bodyClassName="p-0">
              {data.ledger.length === 0 ? (
                <p className="p-5 text-sm text-neutral-500">None.</p>
              ) : (
                <ul className="divide-y divide-neutral-100 text-sm">
                  {data.ledger.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-5 py-2.5"
                    >
                      <span>
                        {entry.reason.replace(/_/g, " ")}
                        <span className="block text-xs text-neutral-500">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </span>
                      <span className="font-bold tabular-nums">
                        {entry.delta > 0 ? "+" : "−"}
                        {formatCount(Math.abs(entry.delta))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </CrmLayout>
  );
}
