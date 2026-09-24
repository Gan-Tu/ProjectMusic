import { useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Captcha, TextField, useCaptcha } from "../ui/Form";
import { useStore } from "../../lib/store";
import Honeypot from "../ui/Honeypot";

const VARIANTS = {
  newsletter: {
    title: "E-mail newsletter",
    field: "Your E-mail",
    placeholder: "Your e-mail",
    type: "email",
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    invalid: "Please enter a valid e-mail address.",
    done: "You're on the list! Watch your inbox for news and drops."
  },
  sms: {
    title: "Text notification",
    field: "Your Phone Number",
    placeholder: "Your phone number",
    type: "tel",
    validate: (v) => v.replace(/\D/g, "").length >= 7,
    invalid: "Please enter a valid phone number.",
    done: "Done! We'll text you about new releases and events."
  }
};

// "Join list" pop-ups from the mock: e-mail newsletter and text notifications.
function ListSignupModal({ open, onClose, kind }) {
  const config = VARIANTS[kind];
  const { state, actions } = useStore();
  const existing = state.subscriptions[kind];
  const captcha = useCaptcha();
  const formId = useId(); // the footer's CAPTCHA and Submit belong to this form
  const [name, setName] = useState(existing?.name || "");
  const [value, setValue] = useState(existing?.value || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const honeypot = useRef(null);

  // Signs up with the studio (the CRM inbox), then remembers it on this device.
  async function submit(e) {
    e?.preventDefault();
    if (sending) return;
    if (!name.trim()) return setError("Please tell us your name.");
    if (!config.validate(value.trim())) return setError(config.invalid);
    if (!captcha.valid) return setError("The numbers don't match, try again.");
    setError("");
    // Honeypot filled in (a bot): act as if it worked, send and keep nothing.
    if (honeypot.current?.value) {
      toast.success(config.done);
      onClose();
      return;
    }
    setSending(true);
    const contact = kind === "sms" ? { payload: { phone: value.trim() } } : { email: value.trim() };
    let failure = "";
    try {
      const response = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: name.trim(), ...contact })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        failure = data.error || "That didn't work. Please try again.";
      }
    } catch {
      failure = "You seem to be offline. Check your connection and try again.";
    }
    setSending(false);
    if (failure) return setError(failure);
    actions.subscribe(kind, { name: name.trim(), value: value.trim() });
    toast.success(config.done);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      size="lg"
      footerStart={<Captcha captcha={captcha} form={formId} />}
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form={formId} disabled={sending}>
            {sending ? "Sending…" : "Submit"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4 py-4">
        <Honeypot inputRef={honeypot} />
        {existing && (
          <p className="flex flex-wrap items-center gap-3 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            You&apos;re subscribed as{" "}
            <span className="font-semibold text-pmred">{existing.value}</span>
            <button
              type="button"
              onClick={() => {
                actions.subscribe(kind, null);
                toast("Unsubscribed.");
                onClose();
              }}
              className="ml-auto font-bold uppercase tracking-wider text-pmred"
            >
              Unsubscribe
            </button>
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={`${kind}-name`}
            label="Your Name"
            placeholder="Your name"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            id={`${kind}-value`}
            label={config.field}
            placeholder={config.placeholder}
            type={config.type}
            value={value}
            autoComplete={kind === "sms" ? "tel" : "email"}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-pmred">
            {error}
          </p>
        )}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

export function NewsletterModal(props) {
  return <ListSignupModal kind="newsletter" {...props} />;
}

export function SmsModal(props) {
  return <ListSignupModal kind="sms" {...props} />;
}
