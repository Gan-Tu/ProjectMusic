import toast from "react-hot-toast";
import { TrashIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { usePlayer } from "../../lib/player";

const WHAT_CLEARS = [
  "Cart, likes, follows and RSVPs",
  "Chats, notifications and feedback",
  "Playlist, play queue and player settings",
  "Settings and sign-up preferences"
];

// Clears what this browser saved (the site's browser-local state). Accounts, orders,
// credits and comments live on the server and aren't touched.
export default function ResetDemoModal({ open, onClose }) {
  const { actions } = useStore();
  const player = usePlayer();

  function clear() {
    actions.resetDemo();
    player.reset();
    toast.success("Cleared the data saved on this device");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clear data on this device"
      size="md"
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={clear}>
            <TrashIcon className="h-4 w-4" />
            Clear this device
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">
        This removes what this browser saved while you used the site and starts it fresh. It
        can&apos;t be undone.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-neutral-500">
        {WHAT_CLEARS.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pmred" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-neutral-200 pt-4 text-xs leading-5 text-neutral-500">
        Your account stays as it is: you stay logged in, and your orders, credits, points and
        comments are stored on the server and are not affected.
      </p>
    </Modal>
  );
}
