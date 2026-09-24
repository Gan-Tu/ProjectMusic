import dynamic from "next/dynamic";
import { useUI } from "../../lib/ui";

// Every pop-up is code-split and only mounted after it has been opened once, so
// none of them weigh on the initial page bundle.
const REGISTRY = {
  settings: dynamic(() => import("./SettingsModal")),
  credits: dynamic(() => import("./CreditsModal")),
  quickNav: dynamic(() => import("./QuickNavModal")),
  newsletter: dynamic(() => import("./ListSignupModal").then((m) => m.NewsletterModal)),
  sms: dynamic(() => import("./ListSignupModal").then((m) => m.SmsModal)),
  chat: dynamic(() => import("./ChatModal")),
  notifications: dynamic(() => import("./NotificationsDrawer")),
  cart: dynamic(() => import("./CartDrawer")),
  playlist: dynamic(() => import("./PlaylistDrawer")),
  purchase: dynamic(() => import("./PurchaseModal")),
  thankYou: dynamic(() => import("./ThankYouModal")),
  contact: dynamic(() => import("./ContactModal"))
};

export default function ModalHost() {
  const { modals, closeModal } = useUI();
  return Object.entries(REGISTRY).map(([name, Component]) => {
    const entry = modals[name];
    if (!entry) return null;
    return (
      <Component
        key={`${name}-${entry.nonce}`}
        open={entry.open}
        onClose={closeModal}
        {...entry.props}
      />
    );
  });
}
