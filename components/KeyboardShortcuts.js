import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { usePlayer } from "../lib/player";
import { useStore } from "../lib/store";
import { MEGA_MENU_TABS, useUI } from "../lib/ui";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function isInteractive(el) {
  if (!el) return false;
  return ["BUTTON", "A", "SUMMARY"].includes(el.tagName) || el.getAttribute("role") === "button";
}

// Global shortcuts from the mock's "Quick navigation" panel:
//   Space play/pause · ←/→ seek 10s (Shift: prev/next song) · 1/2/3 open the menu
//   categories · P playlist · B add to cart · M mute · ? quick navigation · Esc close menu
export default function KeyboardShortcuts() {
  const player = usePlayer();
  const ui = useUI();
  const { actions } = useStore();
  const latest = useRef(null);

  useEffect(() => {
    latest.current = { player, ui, actions };
  });

  useEffect(() => {
    function onKeyDown(e) {
      if (!latest.current || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target) || e.target?.closest?.("video, audio")) return;
      const { player: p, ui: u, actions: a } = latest.current;

      if (e.key === "Escape" && u.megaMenu.open) {
        u.closeMegaMenu();
        return;
      }
      // Pop-ups handle their own keys (focus is trapped inside them).
      if (u.activeModal) return;

      switch (e.key) {
        case " ":
          if (isInteractive(e.target)) return;
          e.preventDefault();
          p.togglePlay();
          break;
        case "ArrowLeft":
        case "ArrowRight": {
          if (u.megaMenu.open) return;
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          if (e.shiftKey) (dir > 0 ? p.next : p.prev)();
          else p.seekBy(dir * 10);
          break;
        }
        case "1":
        case "2":
        case "3":
          u.openMegaMenu(MEGA_MENU_TABS[Number(e.key) - 1]);
          break;
        case "p":
        case "P":
          u.openModal("playlist");
          break;
        case "b":
        case "B":
          if (u.cartCandidate) {
            a.addToCart(u.cartCandidate, u.cartCandidate.qty || 1);
            toast.success(`${u.cartCandidate.name} added to your cart`);
          } else if (p.track) {
            u.openModal("purchase", {
              item: {
                id: `stream:${p.track.id}`,
                name: p.track.title,
                subtitle: p.track.artist,
                image: p.track.cover,
                kind: "music",
                credits: 50,
                price: 0.99
              }
            });
          }
          break;
        case "m":
        case "M":
          p.toggleMute();
          break;
        case "?":
          u.openModal("quickNav");
          break;
        default:
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
