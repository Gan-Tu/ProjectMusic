import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { classNames, formatNumber, formatUSD } from "../../lib/format";
import { CREDIT_PACKS, creditPackItem } from "../../lib/pricing";

const PACKS = CREDIT_PACKS.slice(0, 4);

function packItem(pack) {
  return { ...creditPackItem(pack), qty: 1 };
}

export default function CreditsModal({ open, onClose }) {
  const { state, actions } = useStore();
  const [pack, setPack] = useState(null);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(null); // credits granted by the completed purchase
  const [busy, setBusy] = useState(false);
  // The confirmation replaces the button that had focus: move focus into it.
  const closeRef = useRef(null);
  useEffect(() => {
    if (done !== null) closeRef.current?.focus();
  }, [done]);

  async function purchase(selected = pack) {
    if (busy) return;
    setBusy(true);
    const result = await actions.checkout("card", [packItem(selected)]);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDone(result.purchase.creditsGranted);
  }

  // "Quick purchase" is a saved preference: skip the confirmation step.
  const quick = Boolean(state.settings.quickCreditPurchase);
  function choose(selected) {
    if (busy) return;
    setPack(selected);
    if (quick) purchase(selected);
  }

  const balance = (
    <div className="ml-auto flex flex-col items-end leading-tight">
      <span className="text-lg font-extrabold text-pmred">{formatNumber(state.credits)}</span>
      <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-500">
        Credits
      </span>
    </div>
  );

  if (done !== null) {
    return (
      <Modal open={open} onClose={onClose} title="Thank you" headerExtra={balance} size="md">
        <div className="py-10 text-center">
          <p className="text-xl font-bold uppercase text-pmred">Thank you for purchasing!</p>
          <p className="mt-3 text-sm text-neutral-500">
            {formatNumber(done)} credits were added. Your balance is now{" "}
            <span className="font-semibold text-neutral-800">{formatNumber(state.credits)}</span>.
          </p>
          <Button ref={closeRef} variant="outline" size="sm" className="mt-8" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pack ? "Confirm purchase" : "Credits purchase"}
      headerExtra={balance}
      size="lg"
      footer={
        pack && (
          <>
            <Button variant="muted" size="xs" disabled={busy} onClick={() => setPack(null)}>
              Back
            </Button>
            <Button size="sm" disabled={!password || busy} onClick={() => purchase()}>
              Purchase {formatUSD(pack.price)}
            </Button>
          </>
        )
      }
    >
      {pack ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) purchase();
          }}
          className="space-y-5"
        >
          <p className="text-sm text-neutral-600">
            You&apos;re buying{" "}
            <strong className="text-pmred">{formatNumber(pack.credits)} credits</strong> for{" "}
            <strong>{formatUSD(pack.price)}</strong>. To confirm this purchase please enter your
            password:
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            aria-label="Password"
            autoFocus
            className="h-10 w-full rounded-full border border-neutral-200 px-4 text-sm focus:border-pmred focus:outline-none"
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={quick}
              onChange={(e) => actions.updateSettings({ quickCreditPurchase: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-pmred"
            />
            <span>
              <span className="font-medium text-neutral-700">Enable quick credit purchase</span>
              <span className="block text-neutral-500">
                Skip this confirmation and buy immediately when you pick a pack.
              </span>
            </span>
          </label>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PACKS.map((p) => (
              <button
                key={p.credits}
                type="button"
                onClick={() => choose(p)}
                disabled={busy}
                className="group flex items-center justify-center gap-5 border border-neutral-200 px-5 py-4 uppercase text-pmred transition-colors hover:border-pmred hover:bg-pmred hover:text-white"
              >
                <span className="flex flex-col items-center border-r border-neutral-200 pr-5 group-hover:border-white/40">
                  <span className="text-2xl font-bold">{formatNumber(p.credits)}</span>
                  <span className="text-2xs text-neutral-500 group-hover:text-white">Credits</span>
                </span>
                <span
                  className={classNames(
                    "rounded-full border border-current px-3 py-1 text-sm font-semibold"
                  )}
                >
                  {formatUSD(p.price)}
                </span>
              </button>
            ))}
          </div>
          <label className="mt-5 flex items-center gap-3 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={quick}
              onChange={(e) => actions.updateSettings({ quickCreditPurchase: e.target.checked })}
              className="h-4 w-4 accent-pmred"
            />
            Quick purchase: buy immediately when I pick a pack
          </label>
        </>
      )}
    </Modal>
  );
}
