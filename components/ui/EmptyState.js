import { classNames } from "../../lib/format";

// "Nothing here yet" block for lists that can be empty (e.g. before the CRM adds
// content): a short uppercase title, an optional line of text and an optional action.
export default function EmptyState({ title, children, action, dark = false, className }) {
  return (
    <div
      className={classNames(
        "flex flex-col items-center px-6 py-24 text-center",
        dark && "bg-black text-white",
        className
      )}
    >
      <h2 className="max-w-full text-sm font-extrabold uppercase tracking-widest wrap-anywhere">
        {title}
      </h2>
      {children && (
        <p
          className={classNames(
            "mt-3 max-w-md text-sm leading-relaxed wrap-anywhere",
            dark ? "text-neutral-400" : "text-neutral-500"
          )}
        >
          {children}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
