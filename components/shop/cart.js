import toast from "react-hot-toast";

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
    subtitle: [product.subtitle, ...Object.values(options)].filter(Boolean).join(" · ")
  };
}

export function showCartToast(item, openModal, quantity = 1) {
  toast.success(
    (notification) => (
      <div className="flex max-w-xs flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          {quantity > 1 ? `${quantity} × ` : ""}
          {item.name} added to cart
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
