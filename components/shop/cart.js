import toast from "react-hot-toast";
import { periodDays } from "../../lib/entitlements";
import { MAX_QTY, salesEnded } from "../../lib/store";

export function makeCartItem(
  product,
  { tier = product.tiers?.[0], size = product.sizes?.[0], color = product.colors?.[0] } = {}
) {
  const options = {};
  if (size) options.size = size;
  if (color) options.color = color;
  if (tier) options.tier = tier.label;
  return {
    id: product.cartId || product.id,
    name: product.name,
    image: product.images[0],
    kind: product.kind,
    price: tier ? tier.price : product.price,
    credits: tier ? tier.credits : product.credits,
    grantsCredits: tier?.grantsCredits || product.grantsCredits || 0,
    options,
    subtitle: [product.subtitle, ...Object.values(options)].filter(Boolean).join(" · "),
    ...(product.startsAt ? { startsAt: product.startsAt } : {}),
    // Download passes (and bundles that include them) grant download access for
    // the tier's period; plans without a period (Basic/Premium/Custom) run a year.
    ...(product.grantsDownloads && tier
      ? { entitlement: { type: "downloads", days: periodDays(tier.label) || 365 } }
      : {})
  };
}

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
