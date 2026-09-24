import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import { useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { tierLine } from "../../lib/pricing";
import { formatCredits, formatNumber, formatUSD } from "../../lib/format";

// Music is sold as stream access (credits) or stream + download (credits or card),
// like the mock; any other item has a single "buy" tier with its own prices.
// Items with tiers (music: stream / stream + download) use them; anything else
// is a single "buy" tier at its own prices.
function tiersFor(item) {
  if (item.tiers?.length) return item.tiers;
  return [{ id: "buy", label: "Buy", credits: item.credits ?? null, price: item.price ?? null }];
}

export default function PurchaseModal({ open, onClose, item }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const [busy, setBusy] = useState(false);
  if (!item) return null;

  const tiers = tiersFor(item);
  const [primary, ...others] = tiers;
  const qty = item.qty || 1;

  async function buy(tier, method) {
    if (busy) return;
    setBusy(true);
    const line = { ...(item.tiers?.length ? tierLine(item, tier.id) : item), qty };
    const result = await actions.checkout(method, [line]);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      if (method === "credits" && tier.credits * qty > state.credits) openModal("credits");
      return;
    }
    openModal("thankYou", { orderId: result.purchase.id });
  }

  const primaryMethod = primary.credits != null ? "credits" : "card";

  return (
    <Modal open={open} onClose={onClose} title="Purchase" size="xl" bodyClassName="p-0">
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex gap-4 p-5 sm:gap-6 sm:p-8">
          <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-pmred p-2 text-center text-xs font-bold uppercase text-white sm:h-32 sm:w-32">
            {item.image ? (
              <Image src={item.image} alt="" fill sizes="128px" className="object-cover" />
            ) : (
              item.name
            )}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold uppercase leading-tight text-pmred [overflow-wrap:anywhere]">
              {item.name}
            </p>
            {item.subtitle && <p className="text-pmred">{item.subtitle}</p>}
            {item.description && (
              <p className="mt-3 border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-600">
                {item.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold uppercase text-neutral-800">
              {item.meta?.map((m) => (
                <span key={m}>{m}</span>
              ))}
              {qty > 1 && <span>Qty {qty}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-pmred px-6 py-8 text-white">
            <span className="text-4xl font-bold">
              {primary.credits != null
                ? formatCredits(primary.credits * qty)
                : formatUSD(primary.price * qty)}
            </span>
            <span className="text-2xs font-bold uppercase tracking-wider">{primary.label}</span>
            <button
              type="button"
              onClick={() => buy(primary, primaryMethod)}
              disabled={busy}
              className="mt-3 rounded-full border-2 border-white px-8 py-1 text-xs font-bold uppercase tracking-wider transition hover:bg-white hover:text-pmred"
            >
              Buy
            </button>
          </div>
          {primary.credits != null && primary.price != null && (
            <button
              type="button"
              onClick={() => buy(primary, "card")}
              className="py-3 text-center text-xs font-semibold text-neutral-500 hover:text-pmred"
            >
              or pay {formatUSD(primary.price * qty)} by card
            </button>
          )}
          {others.map((tier) => (
            <div key={tier.id} className="px-6 py-4 text-center">
              <p className="text-2xs font-bold uppercase tracking-wider text-neutral-800">
                {tier.label}
              </p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm font-bold text-pmred">
                {tier.credits != null && (
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => buy(tier, "credits")}
                  >
                    {formatCredits(tier.credits * qty)}
                  </button>
                )}
                {tier.credits != null && tier.price != null && (
                  <span className="text-2xs font-normal uppercase text-neutral-500">or</span>
                )}
                {tier.price != null && (
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => buy(tier, "card")}
                  >
                    {formatUSD(tier.price * qty)}
                  </button>
                )}
              </p>
            </div>
          ))}
          <p className="border-t border-neutral-100 px-6 py-3 text-center text-2xs uppercase tracking-wider text-neutral-500">
            Balance {formatNumber(state.credits)} credits
          </p>
        </div>
      </div>
    </Modal>
  );
}
