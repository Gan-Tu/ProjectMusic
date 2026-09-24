import toast from "react-hot-toast";
import { MAX_QTY, productLine } from "../../lib/pricing";
import { salesEnded } from "../../lib/store";

// The cart line for a product with the chosen tier / size / color (shared with the
// server, which re-prices every line at checkout).
export const makeCartItem = productLine;

// Feedback after adding `requested` of an item, of which `added` fit in the cart.
export function showCartToast(item, openModal, added = 1, requested = added) {
  if (!added && salesEnded(item)) {
    toast.error(`Ticket sales for ${item.name} have ended.`);
    return;
  }
  if (!added) {
    toast.error(`Your cart already has the maximum of ${MAX_QTY} × ${item.name}.`);
    return;
  }
  const quantity = added;
  toast.success(
    (notification) => (
      <div className="flex max-w-xs flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          {quantity > 1 || added < requested ? `${quantity} × ` : ""}
          {item.name} added to cart
          {added < requested && (
            <span className="mt-1 block text-xs text-neutral-500">
              That&apos;s the limit of {MAX_QTY} per item.
            </span>
          )}
          {item.subtitle && (
            <span className="mt-1 block text-xs text-neutral-500">{item.subtitle}</span>
          )}
        </span>
        <button
          type="button"
          className="cursor-pointer font-bold text-pmred underline underline-offset-4"
          onClick={() => {
            toast.dismiss(notification.id);
            openModal("cart");
          }}
        >
          View cart
        </button>
      </div>
    ),
    { duration: 5000 }
  );
}
