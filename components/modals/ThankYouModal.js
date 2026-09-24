import Link from "next/link";
import { DialogTitle } from "@headlessui/react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function ThankYouModal({ open, onClose, title = "Thank you", message, orderId }) {
  return (
    <Modal open={open} onClose={onClose} size="md" hideClose bodyClassName="px-8 py-2">
      <div className="flex flex-col items-center py-8 text-center">
        <DialogTitle className="text-sm font-bold uppercase tracking-wider">{title}</DialogTitle>
        <div className="my-10 text-sm uppercase tracking-wide text-neutral-500">
          {message || (
            <>
              Your purchase is available in{" "}
              <Link
                href="/profile?tab=purchased"
                onClick={onClose}
                className="font-bold text-pmred hover:underline"
              >
                your profile
              </Link>
            </>
          )}
          {orderId && (
            <p className="mt-3 text-xs normal-case tracking-normal text-neutral-400">
              Order {orderId}
            </p>
          )}
        </div>
        <Button variant="outline" size="xs" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
