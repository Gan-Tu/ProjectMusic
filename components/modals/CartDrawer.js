import { useState } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Drawer } from "../ui/Modal";
import Button from "../ui/Button";
import { cartTotals, MAX_QTY, useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { classNames, formatCredits, formatNumber, formatUSD } from "../../lib/format";

function Price({ item }) {
  return (
    <span className="flex flex-col items-end text-sm">
      {item.price != null && (
        <span className="font-semibold text-pmred">{formatUSD(item.price * item.qty)}</span>
      )}
      {item.credits != null && (
        <span className="text-xs text-neutral-400">{formatCredits(item.credits * item.qty)}</span>
      )}
    </span>
  );
}

export default function CartDrawer({ open, onClose }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const totals = cartTotals(state.cart);
  const [method, setMethod] = useState(() => (totals.cardPayable ? "card" : "credits"));
  const payable = method === "card" ? totals.cardPayable : totals.creditsPayable;
  const enoughCredits = totals.credits <= state.credits;

  const [busy, setBusy] = useState(false);

  async function checkout() {
    if (busy) return;
    setBusy(true);
    const result = await actions.checkout(method);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    openModal("thankYou", { orderId: result.purchase.id });
  }

  const footer = state.cart.length > 0 && (
    <div className="space-y-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Items</dt>
          <dd>{totals.count}</dd>
        </div>
        {totals.cardPayable && (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Total (card)</dt>
            <dd className="font-bold text-pmred">{formatUSD(totals.usd)}</dd>
          </div>
        )}
        {totals.creditsPayable && (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Total (credits)</dt>
            <dd className="font-bold">{formatCredits(totals.credits)}</dd>
          </div>
        )}
      </dl>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-2xs font-bold uppercase tracking-wider text-neutral-500">
          Pay with
        </legend>
        {[
          { id: "card", label: "Card", enabled: totals.cardPayable },
          {
            id: "credits",
            label: `Credits (${formatNumber(state.credits)})`,
            enabled: totals.creditsPayable
          }
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={!option.enabled}
            aria-pressed={method === option.id}
            onClick={() => setMethod(option.id)}
            className={classNames(
              "rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-30",
              method === option.id
                ? "border-pmred bg-pmred text-white"
                : "border-neutral-300 text-neutral-500 hover:border-pmred"
            )}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      {method === "credits" && totals.creditsPayable && !enoughCredits && (
        <p className="text-xs text-pmred">
          You need {formatCredits(totals.credits - state.credits)} more.{" "}
          <button
            type="button"
            className="font-bold underline"
            onClick={() => openModal("credits")}
          >
            Buy credits
          </button>
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={busy || !payable || (method === "credits" && !enoughCredits)}
        onClick={checkout}
      >
        Checkout {method === "card" ? formatUSD(totals.usd) : formatCredits(totals.credits)}
      </Button>
      {!totals.cardPayable && !totals.creditsPayable && (
        <p className="text-xs text-neutral-400">
          Some items can only be paid by card and others only with credits. Check them out
          separately.
        </p>
      )}
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} title={`Your cart (${totals.count})`} footer={footer}>
      {state.cart.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <ShoppingCartIcon className="h-12 w-12 text-neutral-200" />
          <p className="text-sm font-bold uppercase tracking-wider">Your cart is empty</p>
          <p className="text-xs text-neutral-400">
            T-shirts, vinyl, tickets, credits and more are waiting in the shop.
          </p>
          <Button href="/shop" variant="outline" onClick={onClose}>
            Browse the shop
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 text-2xs font-bold uppercase tracking-wider">
            <span className="text-neutral-400">
              {totals.count} item{totals.count === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => {
                const undo = actions.clearCartWithUndo();
                toast((t) => (
                  <span className="flex items-center gap-4">
                    Cart cleared
                    <button
                      type="button"
                      onClick={() => {
                        undo();
                        toast.dismiss(t.id);
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-pmred"
                    >
                      Undo
                    </button>
                  </span>
                ));
              }}
              className="text-neutral-400 transition hover:text-pmred"
            >
              Clear cart
            </button>
          </div>
          <ul className="divide-y divide-neutral-200">
            {state.cart.map((line) => (
              <li key={line.key} className="flex gap-4 px-6 py-5">
                <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-pmred text-center text-2xs font-bold uppercase text-white">
                  {line.image ? (
                    <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    line.name
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase">{line.name}</p>
                      {line.subtitle && (
                        <p className="truncate text-xs text-neutral-400">{line.subtitle}</p>
                      )}
                      {line.options && Object.keys(line.options).length > 0 && (
                        <p className="text-xs text-neutral-500">
                          {Object.entries(line.options)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <Price item={line} />
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-neutral-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={line.qty <= 1}
                        onClick={() => actions.updateCartQty(line.key, line.qty - 1)}
                        className="p-1.5 text-neutral-500 hover:text-pmred disabled:opacity-30"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={line.qty >= MAX_QTY}
                        onClick={() => actions.updateCartQty(line.key, line.qty + 1)}
                        className="p-1.5 text-neutral-500 hover:text-pmred"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.removeFromCart(line.key)}
                      className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-neutral-400 hover:text-pmred"
                    >
                      <TrashIcon className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
