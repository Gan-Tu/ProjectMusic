import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { TextField, Captcha, useCaptcha } from "../ui/Form";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";

export default function CommunityForm({ volunteer = false }) {
  const captcha = useCaptcha();
  const { actions } = useStore();
  const [submitted, setSubmitted] = useState(null); // contact: { subject, message }
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(data.entries());
    if (
      !values.name.trim() ||
      !(volunteer ? values.skills : values.message).trim() ||
      (!volunteer && !values.subject.trim())
    ) {
      setError("Please complete all required fields.");
      return;
    }
    if (volunteer && data.getAll("availability").length === 0) {
      setError("Choose at least one availability option.");
      return;
    }
    if (!captcha.valid) {
      setError("Please type the four numbers shown below.");
      return;
    }
    if (volunteer)
      actions.subscribe("volunteer", {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        skills: values.skills.trim(),
        availability: data.getAll("availability")
      });
    else
      actions.saveContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim()
      });
    setSubmitted(
      volunteer
        ? {}
        : {
            name: values.name.trim(),
            email: values.email.trim(),
            subject: values.subject.trim(),
            message: values.message.trim()
          }
    );
    toast.success(
      volunteer
        ? "Thanks for joining the crew!"
        : "Message saved on this device. Use Open email to send it to the studio."
    );
  }
  if (submitted)
    return (
      <div className="py-16 text-center" role="status">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-pmred" />
        <h2 className="mt-6 text-2xl font-extrabold uppercase">
          {volunteer ? "You’re on the list." : "Thank you for reaching out."}
        </h2>
        <p className="mx-auto mb-8 mt-4 max-w-md text-sm leading-relaxed text-neutral-500">
          {volunteer
            ? "Your interests and availability have been saved in this demo. Thank you for being part of the Projct community."
            : "Your message is saved on this device. This demo doesn’t send email, so use Open email below to send it to the studio."}
        </p>
        <Button
          href={
            volunteer
              ? "/"
              : `mailto:contact@projctmusic.com?subject=${encodeURIComponent(
                  submitted.subject
                )}&body=${encodeURIComponent(
                  `${submitted.message}\n\n${submitted.name}\n${submitted.email}`
                )}`
          }
          variant="outline"
        >
          {volunteer ? "Explore Projct" : "Open email"}
        </Button>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id={`${volunteer ? "volunteer" : "contact"}-name`}
          label="Full name *"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          placeholder="Your full name"
        />
        <TextField
          id={`${volunteer ? "volunteer" : "contact"}-email`}
          label="Email *"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          placeholder="you@example.com"
        />
        {volunteer ? (
          <TextField
            id="volunteer-phone"
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            placeholder="Your phone number"
            className="sm:col-span-2"
          />
        ) : (
          <TextField
            id="contact-subject"
            label="Subject *"
            name="subject"
            required
            maxLength={150}
            placeholder="What’s on your mind?"
            className="sm:col-span-2"
          />
        )}
      </div>
      <TextField
        id={volunteer ? "volunteer-skills" : "contact-message"}
        label={volunteer ? "Your skills and interests *" : "Message *"}
        name={volunteer ? "skills" : "message"}
        textarea
        required
        maxLength={4000}
        placeholder={
          volunteer
            ? "Photography, events, music, design… tell us what you love doing."
            : "Tell us a little more…"
        }
      />
      {volunteer && (
        <fieldset>
          <legend className="mb-3 text-xs font-medium">When are you available? *</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {["Weekdays", "Evenings", "Weekends"].map((day) => (
              <label
                key={day}
                className="flex cursor-pointer items-center gap-2 text-sm text-neutral-500"
              >
                <input
                  type="checkbox"
                  name="availability"
                  value={day}
                  className="h-4 w-4 accent-pmred"
                />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="border-t border-neutral-200 pt-6">
        <p className="mb-3 text-xs text-neutral-500">Quick check: enter the numbers shown.</p>
        <Captcha captcha={captcha} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-pmred">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xs text-xs leading-relaxed text-neutral-500">
          Demo only. Your submission is saved on this device.
        </p>
        <div className="flex gap-3">
          <Button href="/" variant="muted" className="cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" className="cursor-pointer" size="md">
            {volunteer ? "Join the crew" : "Send message"}
          </Button>
        </div>
      </div>
    </form>
  );
}
