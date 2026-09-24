import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Captcha, TextField, useCaptcha } from "../ui/Form";
import { useSessionContext } from "../../lib/SessionProvider";

export default function ContactModal({ open, onClose, subject: initialSubject = "" }) {
  const [session] = useSessionContext();
  const captcha = useCaptcha();
  const [form, setForm] = useState({
    name: session.user?.name || "",
    email: session.user?.email || "",
    subject: initialSubject,
    message: ""
  });
  const [error, setError] = useState("");
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function submit(e) {
    e?.preventDefault();
    if (!form.name.trim() || !form.message.trim())
      return setError("Name and message are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Please enter a valid e-mail.");
    if (!captcha.valid) return setError("The numbers don't match, try again.");
    toast.success("Thanks! Our team will get back to you shortly.");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contact Projct Music"
      size="lg"
      footerStart={<Captcha captcha={captcha} />}
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Send
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-5 py-2 sm:grid-cols-2">
        <TextField
          id="contact-name"
          label="Your Name"
          value={form.name}
          onChange={set("name")}
          placeholder="Your name"
        />
        <TextField
          id="contact-email"
          label="Your E-mail"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="Your e-mail"
        />
        <TextField
          id="contact-subject"
          label="Subject"
          className="sm:col-span-2"
          value={form.subject}
          onChange={set("subject")}
          placeholder="What is it about?"
        />
        <TextField
          id="contact-message"
          label="Message"
          textarea
          className="sm:col-span-2"
          value={form.message}
          onChange={set("message")}
          placeholder="Type your message…"
        />
        {error && (
          <p role="alert" className="text-xs font-medium text-pmred sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
