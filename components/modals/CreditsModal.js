import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { classNames, formatNumber, formatUSD } from "../../lib/format";

export const CREDIT_PACKS = [
  { credits: 100, price: 0.99 },
  { credits: 500, price: 4.99 },
  { credits: 1000, price: 9.99 },
  { credits: 2000, price: 19.99 }
];

function packItem(pack) {
  return {
    id: `credits-${pack.credits}`,
    name: `${formatNumber(pack.credits)} Credits`,
    kind: "digital",
    price: pack.price,
    credits: null,
    grantsCredits: pack.credits,
    qty: 1
  };
}

export default function CreditsModal({ open, onClose }) {
  const { state, actions } = useStore();
  const [pack, setPack] = useState(null);
  const [password, setPassword] = useState("");
  const [quick, setQuick] = useState(false);
  const [done, setDone] = useState(false);

  function purchase(selected = pack) {
    const result = actions.checkout("card", [packItem(selected)]);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDone(true);
  }

  function choose(selected) {
    setPack(selected);
    if (quick) purchase(selected);
  }

  const balance = (
    <div className="ml-auto flex flex-col items-end leading-tight">
      <span className="text-lg font-extrabold text-pmred">{formatNumber(state.credits)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Credits
      </span>
    </div>
  );

  if (done) {
    return (
      <Modal open={open} onClose={onClose} title="Thank you" headerExtra={balance} size="md">
        <div className="py-10 text-center">
          <p className="text-xl font-bold uppercase text-pmred">Thank you for purchasing!</p>
          <p className="mt-3 text-sm text-neutral-500">
            {formatNumber(pack.credits)} credits were added. Your balance is now{" "}
            <span className="font-semibold text-neutral-800">{formatNumber(state.credits)}</span>.
          </p>
          <Button variant="outline" size="sm" className="mt-8" onClick={onClose}>
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
            <Button variant="muted" size="xs" onClick={() => setPack(null)}>
              Back
            </Button>
            <Button size="sm" disabled={!password} onClick={() => purchase()}>
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
              onChange={(e) => setQuick(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-pmred"
            />
            <span>
              <span className="font-medium text-neutral-700">Enable quick credit purchase</span>
              <span className="block text-neutral-400">
                Skip this confirmation and buy immediately when you pick a pack.
              </span>
            </span>
          </label>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDIT_PACKS.map((p) => (
            <button
              key={p.credits}
              type="button"
              onClick={() => choose(p)}
              className="group flex items-center justify-center gap-5 border border-neutral-200 px-5 py-4 uppercase text-pmred transition-colors hover:border-pmred hover:bg-pmred hover:text-white"
            >
              <span className="flex flex-col items-center border-r border-neutral-200 pr-5 group-hover:border-white/40">
                <span className="text-2xl font-bold">{formatNumber(p.credits)}</span>
                <span className="text-[10px] text-neutral-400 group-hover:text-white">Credits</span>
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
      )}
    </Modal>
  );
}
