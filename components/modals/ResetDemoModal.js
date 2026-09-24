import toast from "react-hot-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { usePlayer } from "../../lib/player";

const WHAT_RESETS = [
  "Cart, likes, follows and RSVPs",
  "Chats, notifications and feedback",
  "Playlist, play queue and player settings",
  "Settings and sign-up preferences"
];

// Puts what this browser saved for the demo back to its original state. Accounts,
// orders, credits and comments live on the server and aren't touched.
export default function ResetDemoModal({ open, onClose }) {
  const { actions } = useStore();
  const player = usePlayer();

  function reset() {
    actions.resetDemo();
    player.reset();
    toast.success("This browser's demo data was reset");
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
            Reset this browser
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">
        This clears what this browser saved while you explored the demo and puts it back the way it
        was on your first visit. It can&apos;t be undone.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-neutral-500">
        {WHAT_RESETS.map((item) => (
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
