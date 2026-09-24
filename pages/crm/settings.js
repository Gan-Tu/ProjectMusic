import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { CrmButton as Button } from "../../components/crm/ui";
import CrmLayout from "../../components/crm/CrmLayout";
import { crmFetch, useCrmData } from "../../components/crm/api";
import { formatDateTime } from "../../components/crm/format";
import {
  Card,
  ErrorNote,
  Field,
  INPUT,
  Segmented,
  Spinner,
  textareaClass
} from "../../components/crm/ui";
import { classNames } from "../../lib/format";
import { crmPage } from "../../lib/server/crm/guard";

export const getServerSideProps = crmPage();

function SettingsForm({ settings, onSaved }) {
  const [bonus, setBonus] = useState(() =>
    String(settings.find((s) => s.key === "signup_bonus_credits")?.value ?? 1000)
  );
  const [texts, setTexts] = useState(() =>
    Object.fromEntries(
      settings
        .filter((s) => s.key !== "signup_bonus_credits")
        .map((s) => [s.key, JSON.stringify(s.value, null, 2)])
    )
  );
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null); // { key, message } from the API
  const errors = {};
  for (const [key, text] of Object.entries(texts)) {
    try {
      JSON.parse(text);
    } catch (error) {
      errors[key] = `Invalid JSON: ${error.message}`;
    }
  }
  if (serverError && !errors[serverError.key]) errors[serverError.key] = serverError.message;
  const invalid = Object.keys(errors).length > 0 || !/^\d+$/.test(bonus.trim());

  async function save(event) {
    event.preventDefault();
    if (invalid) return;
    setBusy(true);
    try {
      const values = { signup_bonus_credits: Number(bonus) };
      for (const [key, text] of Object.entries(texts)) values[key] = JSON.parse(text);
      const { settings: saved } = await crmFetch("/api/crm/settings", {
        method: "PUT",
        body: { values }
      });
      toast.success("Settings saved.");
      onSaved(saved);
    } catch (error) {
      const key = String(error.data?.field || "").split(/[.[]/)[0];
      if (key) setServerError({ key, message: error.message });
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <Card
        title="Site settings"
        actions={
          <Button type="submit" size="sm" disabled={busy || invalid}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <Field
            label="Sign-up bonus (credits)"
            htmlFor="setting-bonus"
            help="Credits every new member receives when they sign up."
            error={/^\d+$/.test(bonus.trim()) ? null : "Enter a whole number of at least 0."}
          >
            <input
              id="setting-bonus"
              type="number"
              min="0"
              step="1"
              value={bonus}
              onChange={(event) => setBonus(event.target.value)}
              className={classNames(INPUT, "max-w-48")}
            />
          </Field>
          {Object.entries(texts).map(([key, text]) => (
            <Field
              key={key}
              label={key === "wikipedia_article" ? "Wikipedia article (JSON)" : `${key} (JSON)`}
              htmlFor={`setting-${key}`}
              help={
                key === "wikipedia_article"
                  ? "The article on /socials/wikipedia: title, subtitle, intro, facts [[label, value]], sections [{ id, title, paragraphs }], discography [[year, title, type, role]], references [{ title, href }]."
                  : undefined
              }
              error={errors[key]}
            >
              <textarea
                id={`setting-${key}`}
                value={text}
                rows={key === "wikipedia_article" ? 18 : 6}
                spellCheck={false}
                onChange={(event) => {
                  setTexts((current) => ({ ...current, [key]: event.target.value }));
                  if (serverError?.key === key) setServerError(null);
                }}
                className={textareaClass({ invalid: Boolean(errors[key]), mono: true })}
              />
            </Field>
          ))}
          <p className="text-xs text-neutral-500">
            Last changed{" "}
            {formatDateTime(
              settings.reduce((latest, s) => (s.updated_at > latest ? s.updated_at : latest), "")
            )}
          </p>
        </div>
      </Card>
    </form>
  );
}

function RefreshCard() {
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      const { revalidation } = await crmFetch("/api/crm/revalidate", { method: "POST" });
      if (revalidation.skipped)
        toast.success("Dev server: pages are always fresh, nothing to refresh.");
      else {
        toast.success(
          `Refreshed ${revalidation.revalidated.length} pages${revalidation.failed.length ? `, ${revalidation.failed.length} failed` : ""}.`
        );
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Refresh public site">
      <p className="mb-4 text-sm leading-6 text-neutral-600">
        Edits refresh the pages they affect automatically. Use this to regenerate every list page
        right away (home, music, artists, videos, events, shop, pictures, news, blog, socials).
      </p>
      <Button onClick={refresh} disabled={busy} size="md" variant="dark">
        <ArrowPathIcon className={classNames("h-4 w-4", busy && "animate-spin")} />
        {busy ? "Refreshing…" : "Refresh public site"}
      </Button>
    </Card>
  );
}

function ResetCard({ onReset }) {
  const [scope, setScope] = useState("content");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function reset(event) {
    event.preventDefault();
    setBusy(true);
    const pending = toast.loading("Resetting to the demo data…");
    try {
      const result = await crmFetch("/api/crm/reset", { method: "POST", body: { scope, confirm } });
      const total = Object.values(result.counts || {}).reduce((sum, n) => sum + n, 0);
      toast.success(`Demo data restored (${total} rows).`, { id: pending });
      setConfirm("");
      onReset();
    } catch (error) {
      toast.error(error.message, { id: pending });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Reset to demo data" className="border-pmred/40">
      <form onSubmit={reset} className="flex flex-col gap-4">
        <p className="flex gap-2 text-sm leading-6 text-neutral-700">
          <ExclamationTriangleIcon className="mt-1 h-4 w-4 shrink-0 text-pmred" />
          Replaces the data with the original demo data. Everything edited or created in the CRM is
          lost. The admin session is kept.
        </p>
        <Segmented
          label="What to reset"
          value={scope}
          onChange={setScope}
          options={[
            { value: "content", label: "Content only" },
            { value: "all", label: "Everything" }
          ]}
        />
        <p className="text-xs leading-5 text-neutral-500">
          {scope === "content"
            ? "Artists, music, videos, events, shop, pictures, posts, socials, comments and site settings."
            : "All content plus members, sessions of members, orders, credit history and the inbox (the demo member is recreated)."}
        </p>
        <Field label='Type "RESET" to confirm' htmlFor="reset-confirm">
          <input
            id="reset-confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            className={classNames(INPUT, "max-w-48 font-mono")}
          />
        </Field>
        <div>
          <Button type="submit" size="md" disabled={busy || confirm !== "RESET"}>
            {busy ? "Resetting…" : "Reset to demo data"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { data, error, reload, setData } = useCrmData("/api/crm/settings");
  const settings = data?.settings;
  return (
    <CrmLayout title="Settings">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          {error && <ErrorNote>{error}</ErrorNote>}
          {!settings && !error && <Spinner />}
          {settings && (
            <SettingsForm
              key={settings.map((setting) => `${setting.key}@${setting.updated_at}`).join()}
              settings={settings}
              onSaved={(saved) => setData({ settings: saved })}
            />
          )}
        </div>
        <div className="flex flex-col gap-6">
          <RefreshCard />
          <ResetCard onReset={reload} />
        </div>
      </div>
    </CrmLayout>
  );
}
