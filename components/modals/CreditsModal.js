import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { loginHref, useSessionContext } from "../../lib/SessionProvider";
import { classNames, formatNumber, formatUSD } from "../../lib/format";
import { CREDIT_PACKS, creditPackItem } from "../../lib/pricing";

const PACKS = CREDIT_PACKS.slice(0, 4);

function packItem(pack) {
  return { ...creditPackItem(pack), qty: 1 };
}

// Credit packs are bought with the (simulated) card, like any other checkout.
export default function CreditsModal({ open, onClose }) {
  const { state, actions } = useStore();
  const [session] = useSessionContext();
  const router = useRouter();
  const [pack, setPack] = useState(null);
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
    if (result.needsLogin) {
      toast.error(result.error);
      onClose();
      router.push(loginHref(router.asPath));
      return;
    }
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

  if (session.hydrated && !session.user) {
    return (
      <Modal open={open} onClose={onClose} title="Credits purchase" size="md">
        <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
          <p className="text-sm text-neutral-600">
            Credits live in your account: use them for music, merch, tickets and passes. Log in or
            create an account (new members get welcome credits) to buy more.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={loginHref(router.asPath)} onClick={onClose}>
              Log in
            </Button>
            <Button href={loginHref(router.asPath, "/signup")} variant="outline" onClick={onClose}>
              Sign up
            </Button>
          </div>
        </div>
      </Modal>
    );
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
            <Button size="sm" disabled={busy} onClick={() => purchase()}>
              {busy ? "Processing…" : `Purchase ${formatUSD(pack.price)}`}
            </Button>
          </>
        )
      }
    >
      {pack ? (
        <div className="space-y-5">
          <p className="text-sm text-neutral-600">
            You&apos;re buying{" "}
            <strong className="text-pmred">{formatNumber(pack.credits)} credits</strong> for{" "}
            <strong>{formatUSD(pack.price)}</strong>, paid with the demo card.
          </p>
          <p className="flex items-center justify-between gap-4 border border-neutral-200 px-4 py-3 text-sm">
            <span className="font-semibold text-neutral-700">Demo card •••• 4242</span>
            <span className="text-xs text-neutral-500">Simulated payment, no real charge</span>
          </p>
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
        </div>
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
