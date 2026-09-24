import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { formatLongDate } from "../../lib/format";
import Button from "../ui/Button";
import { showCartToast } from "../shop/cart";

export function TicketButton({ event, tier, className = "" }) {
  const { actions } = useStore();
  const { openModal } = useUI();
  function addTicket() {
    const item = {
      id: `ticket:${event.id}`,
      name: event.title,
      subtitle: `${formatLongDate(event.date)} · ${event.address[0]}`,
      image: event.image,
      kind: "ticket",
      price: tier?.price ?? event.price,
      credits: tier?.credits ?? event.credits,
      options: { tier: tier?.name || "General admission" }
    };
    showCartToast(item, openModal, actions.addToCart(item));
  }
  return (
    <Button variant="outline" className={`cursor-pointer ${className}`} onClick={addTicket}>
      Get tickets
    </Button>
  );
}

export function InterestedButton({ event, className = "" }) {
  const { state, actions } = useStore();
  const interested = !!state.rsvps[event.id];
  return (
    <button
      type="button"
      onClick={() => actions.toggleRsvp(event.id)}
      aria-pressed={interested}
      aria-label={`Interested in ${event.title}`}
      className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 text-2xs font-semibold uppercase tracking-wider ${className}`}
    >
      {interested ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
      {interested ? "Interested" : "I'm interested"}
    </button>
  );
}
