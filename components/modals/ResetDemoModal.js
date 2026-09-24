import toast from "react-hot-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { usePlayer } from "../../lib/player";
import { useSessionContext } from "../../lib/SessionProvider";

const WHAT_RESETS = [
  "Cart, orders and credits balance",
  "Comments, likes, follows and RSVPs",
  "Chats, notifications and feedback",
  "Playlist, play queue and player settings",
  "Settings, subscriptions and profile edits (you stay logged in as Nick)"
];

// Puts the whole single-user demo back to its original state.
export default function ResetDemoModal({ open, onClose }) {
  const { actions } = useStore();
  const player = usePlayer();
  const [, dispatch] = useSessionContext();

  function reset() {
    actions.resetDemo();
    player.reset();
    dispatch({ type: "set_user", user: {} });
    toast.success("Demo data reset to the original state");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset demo data"
      size="md"
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={reset}>
            <ArrowPathIcon className="h-4 w-4" />
            Reset everything
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">
        This puts the app back the way it was on your first visit. It can&apos;t be undone.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-neutral-500">
        {WHAT_RESETS.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pmred" />
            {item}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
