import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Button from "../../../components/ui/Button";
import CrmLayout from "../../../components/crm/CrmLayout";
import EntityEditor from "../../../components/crm/EntityEditor";
import { crmFetch, useCrmData } from "../../../components/crm/api";
import { threadLabel, threadPath } from "../../../components/crm/entityDefs";
import { formatCount, formatDateTime, formatMoney } from "../../../components/crm/format";
import { Card, ErrorNote, Field, INPUT, Spinner, StatusBadge } from "../../../components/crm/ui";
import { classNames } from "../../../lib/format";
import { crmPage } from "../../../lib/server/crm/guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getServerSideProps = crmPage(async ({ params }) =>
  UUID.test(params.id) ? { props: { id: params.id } } : { notFound: true }
);

function CreditsForm({ id, credits, onDone }) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = Number(delta);
  const valid = Number.isInteger(amount) && amount !== 0 && credits + amount >= 0;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await crmFetch(`/api/crm/members/${id}/credits`, {
        method: "POST",
        body: { delta: amount, note }
      });
      toast.success(`Balance is now ₵${formatCount(result.credits)}.`);
      setDelta("");
      setNote("");
      onDone();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Credits">
      <p className="text-3xl font-extrabold">₵{formatCount(credits)}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <Field label="Add / remove (use − for removal)" htmlFor="credit-delta">
          <input
            id="credit-delta"
            type="number"
            step="1"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            placeholder="e.g. 500 or -200"
            className={INPUT}
          />
        </Field>
        <Field label="Note" htmlFor="credit-note">
          <input
            id="credit-note"
            value={note}
            maxLength={300}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why? (shown in the credit history)"
            className={INPUT}
          />
        </Field>
        {delta && credits + amount < 0 && (
          <p className="text-xs text-pmred">The balance can&apos;t go below 0.</p>
        )}
        <div>
          <Button type="submit" size="md" disabled={!valid || busy}>
            {busy ? "Saving…" : "Adjust credits"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm({ id }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await crmFetch(`/api/crm/members/${id}/password`, { method: "POST", body: { password } });
      toast.success("Password changed. The member was signed out everywhere.");
      setPassword("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Set a new password">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="text"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete="off"
          placeholder="At least 8 characters"
          aria-label="New password"
          className={INPUT}
        />
        <div>
          <Button type="submit" size="md" variant="dark" disabled={password.length < 8 || busy}>
            {busy ? "Saving…" : "Set password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

const TH = "px-4 py-2 text-left text-2xs font-bold uppercase tracking-widest text-neutral-500";
const TD = "px-4 py-2.5 align-top";

export default function MemberPage({ id }) {
  const { data, error, reload } = useCrmData(`/api/crm/members/${id}`);
  const [version, setVersion] = useState(0);
  const member = data?.member;
  return (
    <CrmLayout title={member ? member.name : "Member"}>
      <Link
        href="/crm/members"
        className="mb-5 inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-neutral-500 transition hover:text-pmred"
      >
        <ArrowLeftIcon className="h-4 w-4" /> All members
      </Link>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!data && !error && <Spinner />}
      {member && (
        <div className="flex flex-col gap-6">
          <EntityEditor key={version} entity="members" id={id} onSaved={() => reload()} />
          <div className="grid gap-6 lg:grid-cols-2">
            <CreditsForm
              id={id}
              credits={member.credits}
              onDone={() => {
                reload();
                setVersion((n) => n + 1);
              }}
            />
            <PasswordForm id={id} />
          </div>
          <Card title={`Orders (${data.orders.length})`} bodyClassName="overflow-x-auto p-0">
            {data.orders.length === 0 ? (
              <p className="p-5 text-sm text-neutral-500">No orders.</p>
            ) : (
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="border-b border-neutral-100">
                  <tr>
                    <th className={TH}>Order</th>
                    <th className={TH}>Date</th>
                    <th className={TH}>Paid</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.orders.map((order) => (
                    <tr key={order.id}>
                      <td className={TD}>
                        <Link
                          href={`/crm/orders/${encodeURIComponent(order.id)}`}
                          className="font-bold hover:text-pmred"
                        >
                          {order.id}
                        </Link>
                        <span className="block text-xs text-neutral-500">
                          {(order.items || [])
                            .map((item) => item.name)
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </td>
                      <td className={TD}>{formatDateTime(order.created_at)}</td>
                      <td className={TD}>
                        {order.method === "credits"
                          ? `₵${formatCount(order.total_credits)}`
                          : formatMoney(order.total_usd)}
                      </td>
                      <td className={TD}>
                        <StatusBadge value={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Credit history" bodyClassName="overflow-x-auto p-0">
            {data.ledger.length === 0 ? (
              <p className="p-5 text-sm text-neutral-500">No credit history.</p>
            ) : (
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="border-b border-neutral-100">
                  <tr>
                    <th className={TH}>Date</th>
                    <th className={TH}>Reason</th>
                    <th className={classNames(TH, "text-right")}>Change</th>
                    <th className={classNames(TH, "text-right")}>Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className={TD}>{formatDateTime(entry.created_at)}</td>
                      <td className={TD}>
                        {entry.reason.replace(/_/g, " ")}
                        {(entry.note || entry.order_id) && (
                          <span className="block text-xs text-neutral-500">
                            {entry.note || entry.order_id}
                          </span>
                        )}
                      </td>
                      <td
                        className={classNames(
                          TD,
                          "text-right font-bold tabular-nums",
                          entry.delta < 0 ? "text-neutral-900" : "text-emerald-700"
                        )}
                      >
                        {entry.delta > 0 ? "+" : "−"}
                        {formatCount(Math.abs(entry.delta))}
                      </td>
                      <td className={classNames(TD, "text-right tabular-nums")}>
                        {formatCount(entry.balance_after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title={`Comments (${data.comments.length})`} bodyClassName="p-0">
            {data.comments.length === 0 ? (
              <p className="p-5 text-sm text-neutral-500">No comments.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.comments.map((comment) => (
                  <li key={comment.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/crm/comments/${encodeURIComponent(comment.id)}`}
                        className="block text-sm hover:text-pmred"
                      >
                        {comment.body}
                      </Link>
                      <span className="block text-xs text-neutral-500">
                        <span title={comment.thread_id}>{threadLabel(comment)}</span> ·{" "}
                        {formatDateTime(comment.created_at)}
                        {threadPath(comment.thread_id, comment.thread_network) && (
                          <>
                            {" · "}
                            <a
                              href={threadPath(comment.thread_id, comment.thread_network)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-pmred-dark hover:underline"
                            >
                              View on site
                            </a>
                          </>
                        )}
                      </span>
                    </span>
                    <StatusBadge value={comment.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </CrmLayout>
  );
}
