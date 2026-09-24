import { useEffect, useRef } from "react";
import { usePlayer } from "../lib/player";
import { useStore } from "../lib/store";
import { MEGA_MENU_TABS, useUI } from "../lib/ui";
import { trackPurchaseItem } from "../lib/pricing";
import { showCartToast } from "./shop/cart";

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
      // Pop-ups handle their own keys (focus is trapped inside them). This covers
      // page-level dialogs too (lightboxes, video pop-ups), not just global ones.
      if (u.activeModal || document.querySelector('[role="dialog"]')) return;

      // Holding a key repeats keydown: only seeking (plain arrows) should repeat;
      // everything else (play/pause, add to cart, mute, skip song...) fires once per press.
      const seeking = (e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.shiftKey;
      if (e.repeat && !seeking) {
        if (e.key === " " && !isInteractive(e.target)) e.preventDefault(); // don't scroll
        return;
      }

      switch (e.key) {
        case " ": {
          if (isInteractive(e.target)) return;
          e.preventDefault();
          const video = p.activeVideo();
          if (!video) p.togglePlay();
          else if (video.paused) video.play().catch(() => {});
          else video.pause();
          break;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          if (u.megaMenu.open) return;
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const video = p.activeVideo();
          if (e.shiftKey) (dir > 0 ? p.next : p.prev)();
          else if (video) video.currentTime = Math.max(0, video.currentTime + dir * 10);
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
        case "B": {
          if (u.cartCandidate) {
            const requested = u.cartCandidate.qty || 1;
            const added = a.addToCart(u.cartCandidate, requested);
            showCartToast(u.cartCandidate, u.openModal, added, requested);
          } else if (p.track) {
            u.openModal("purchase", { item: trackPurchaseItem(p.track) });
          }
          break;
        }
        case "m":
        case "M": {
          const video = p.activeVideo();
          if (video) video.muted = !video.muted;
          else p.toggleMute();
          break;
        }
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
