// A form field people never see (off-screen, skipped by keyboard and screen readers)
// but form-filling bots do: anything typed into it marks the submission as spam (see
// /api/inbox). Read it as the form's "website" value, or through `inputRef`.
export default function Honeypot({ inputRef }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input ref={inputRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
