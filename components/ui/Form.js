import { useCallback, useState } from "react";
import { Switch } from "@headlessui/react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/format";

// Pill-shaped input with a label above it, as used by the mock's forms.
export function TextField({ label, id, className, inputClassName, textarea = false, ...props }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <label htmlFor={id} className={classNames("flex flex-col gap-2", className)}>
      {label && <span className="text-xs font-medium text-neutral-800">{label}</span>}
      <Input
        id={id}
        className={classNames(
          "w-full border border-neutral-200 bg-white px-4 text-sm text-neutral-800 placeholder:text-neutral-300 transition focus:border-pmred focus:outline-none focus:ring-2 focus:ring-pmred/15",
          textarea ? "min-h-28 rounded-2xl py-3" : "h-10 rounded-full",
          inputClassName
        )}
        {...props}
      />
    </label>
  );
}

// Green switch used by the settings pop-up.
export function Toggle({ checked, onChange, label, className }) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className={classNames(
        "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-200 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 data-checked:bg-lime-500",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-5"
      />
    </Switch>
  );
}

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Tiny "type the numbers" check from the newsletter / text notification mocks.
export function useCaptcha() {
  const [code, setCode] = useState(randomCode);
  const [input, setInput] = useState("");
  const refresh = useCallback(() => {
    setCode(randomCode());
    setInput("");
  }, []);
  return { code, input, setInput, refresh, valid: input.trim() === code };
}

// `form`: the id of the form it belongs to when rendered outside it (e.g. in a
// pop-up's footer), so Enter in the field submits that form.
export function Captcha({ captcha, className, form }) {
  return (
    <div className={classNames("flex items-center gap-3", className)}>
      <span
        aria-label={`Type the numbers ${captcha.code.split("").join(" ")}`}
        className="select-none font-mono text-sm font-bold italic tracking-[0.3em] text-neutral-900 [text-shadow:1px_1px_0_#ddd]"
      >
        {captcha.code}
      </span>
      <button
        type="button"
        onClick={captcha.refresh}
        aria-label="New numbers"
        className="text-pmred transition hover:rotate-180"
      >
        <ArrowPathIcon className="h-4 w-4" />
      </button>
      <input
        value={captcha.input}
        onChange={(e) => captcha.setInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        form={form}
        placeholder="Type the numbers"
        aria-label="Type the numbers"
        className="h-9 w-36 rounded-full border border-neutral-200 px-4 text-xs placeholder:text-neutral-300 focus:border-pmred focus:outline-none"
      />
    </div>
  );
}
