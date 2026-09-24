import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

// Global UI state: which pop-up is open, the mega menu, and the item the "B"
// (add to cart) shortcut should act on.
//
// Pop-ups rendered by components/modals/ModalHost.js (name → props):
//   "settings"      { tab?: "general" | "security" | "playlist" }
//   "credits"       {}                  buy credit packs
//   "quickNav"      {}                  quick navigation + keyboard shortcuts
//   "newsletter"    {}                  e-mail newsletter sign-up ("Join list")
//   "sms"           {}                  text notification sign-up
//   "chat"          { chatId? }         messenger
//   "notifications" {}                  activity feed
//   "cart"          {}                  cart drawer + checkout
//   "playlist"      {}                  play queue + saved playlist drawer
//   "purchase"      { item }            buy one item (stream / download / product)
//   "thankYou"      { title?, message? }
//   "reset"         {}                  reset all demo data (confirmation)

const UIContext = createContext(null);

export const MEGA_MENU_TABS = ["home", "shop", "socials"];

export function UIProvider({ children }) {
  const router = useRouter();
  // Each pop-up keeps its last props after closing so exit transitions don't flash empty.
  const [modals, setModals] = useState({});
  const [megaMenu, setMegaMenu] = useState({ open: false, tab: "home" });
  const [cartCandidate, setCartCandidate] = useState(null);

  const openModal = useCallback((name, props = {}) => {
    setModals((current) => {
      const next = {};
      for (const key of Object.keys(current)) next[key] = { ...current[key], open: false };
      // `nonce` lets the host remount the pop-up on every open (fresh internal state).
      next[name] = { open: true, props, nonce: (current[name]?.nonce || 0) + 1 };
      return next;
    });
    setMegaMenu((m) => (m.open ? { ...m, open: false } : m));
  }, []);

  const closeModal = useCallback(() => {
    setModals((current) => {
      if (!Object.values(current).some((m) => m.open)) return current;
      const next = {};
      for (const key of Object.keys(current)) next[key] = { ...current[key], open: false };
      return next;
    });
  }, []);

  // Close menus/pop-ups when navigating to another page.
  useEffect(() => {
    const onRoute = () => {
      setMegaMenu((m) => (m.open ? { ...m, open: false } : m));
      closeModal();
    };
    router.events.on("routeChangeStart", onRoute);
    return () => router.events.off("routeChangeStart", onRoute);
  }, [router.events, closeModal]);

  const activeModal = Object.keys(modals).find((name) => modals[name].open) || null;

  const value = useMemo(
    () => ({
      modals,
      activeModal,
      modal: activeModal ? { name: activeModal, props: modals[activeModal].props } : null,
      openModal,
      closeModal,
      megaMenu,
      openMegaMenu: (tab) => setMegaMenu((m) => ({ open: true, tab: tab || m.tab })),
      closeMegaMenu: () => setMegaMenu((m) => (m.open ? { ...m, open: false } : m)),
      toggleMegaMenu: () => setMegaMenu((m) => ({ ...m, open: !m.open })),
      setMegaMenuTab: (tab) => setMegaMenu((m) => ({ ...m, tab })),
      // Pages that show a buyable item register it so "B" adds it to the cart.
      cartCandidate,
      setCartCandidate
    }),
    [modals, activeModal, openModal, closeModal, megaMenu, cartCandidate]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

// For product/detail pages: registers the item for the "B" shortcut while mounted.
// Keyed by the serialized item so passing a fresh object each render is safe.
export function useCartCandidate(item) {
  const { setCartCandidate } = useUI();
  const key = item ? JSON.stringify(item) : null;
  useEffect(() => {
    setCartCandidate(key ? JSON.parse(key) : null);
    return () => setCartCandidate(null);
  }, [key, setCartCandidate]);
}
