import { useToasterStore } from "react-hot-toast";

// While a pop-up is open, Headless UI makes the rest of the page (the toaster
// included) inert, so screen readers wouldn't hear toasts. Pop-ups render this to
// repeat the current text toasts inside themselves.
export default function ToastAnnouncer() {
  const { toasts } = useToasterStore();
  const shown = toasts.filter((t) => t.visible && typeof t.message === "string");
  return (
    <>
      <div role="alert" className="sr-only">
        {shown
          .filter((t) => t.type === "error")
          .map((t) => (
            <p key={t.id}>{t.message}</p>
          ))}
      </div>
      <div role="status" className="sr-only">
        {shown
          .filter((t) => t.type !== "error")
          .map((t) => (
            <p key={t.id}>{t.message}</p>
          ))}
      </div>
    </>
  );
}
