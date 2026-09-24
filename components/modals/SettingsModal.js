import { useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Image from "../ui/SmartImage";
import { TabList, tabPanelProps } from "../ui/Tabs";
import { Toggle } from "../ui/Form";
import { useStore } from "../../lib/store";
import { initialsAvatar, loginHref, useSessionContext } from "../../lib/SessionProvider";
import { useUI } from "../../lib/ui";
import { classNames, pad2 } from "../../lib/format";

const TABS = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "playlist", label: "Playlist" }
];

const INPUT =
  "h-8 min-w-0 rounded-full border border-neutral-200 px-3 text-sm focus:border-pmred focus:outline-none";

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <span className="text-sm text-neutral-700">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function EditableRow({ label, value, type = "text", editing, onEdit, onChange, placeholder }) {
  return (
    <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 py-3.5">
      <span className="text-sm text-neutral-700">{label}</span>
      {editing ? (
        <input
          type={type}
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEdit()}
          aria-label={label}
          placeholder={placeholder}
          className={classNames(INPUT, "text-right")}
        />
      ) : (
        <span className="truncate text-right text-sm text-pmred">
          {value || <span className="text-neutral-400">{placeholder || "Not set"}</span>}
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="text-2xs font-bold uppercase tracking-wider text-pmred hover:text-pmred-dark"
      >
        {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

// Changes the password right away (separately from "Accept"): current + new.
function PasswordRow({ open, onToggle, isDemo }) {
  const [session] = useSessionContext();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }

  async function change(e) {
    e.preventDefault();
    if (busy) return;
    if (next.length < 8) {
      setMessage({ ok: false, text: "Use at least 8 characters for your new password." });
      return;
    }
    setBusy(true);
    const result = await session.changePassword(current, next);
    setBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error });
      return;
    }
    setCurrent("");
    setNext("");
    setMessage({ ok: true, text: "Password changed. Other devices were logged out." });
  }

  return (
    <div className="py-3.5">
      <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4">
        <span className="text-sm text-neutral-700">Password</span>
        <span className="truncate text-right text-sm text-pmred">••••••••</span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="text-2xs font-bold uppercase tracking-wider text-pmred hover:text-pmred-dark"
        >
          {open ? "Done" : "Edit"}
        </button>
      </div>
      {open &&
        (isDemo ? (
          <p className="mt-3 text-right text-xs text-neutral-500">
            The shared demo account&apos;s password can&apos;t be changed. Sign up to get your own
            account.
          </p>
        ) : (
          <form onSubmit={change} className="mt-3 flex flex-col items-end gap-2">
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              placeholder="Current password"
              aria-label="Current password"
              maxLength={128}
              required
              className={classNames(INPUT, "w-full max-w-64")}
            />
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder="New password (8+ characters)"
              aria-label="New password"
              minLength={8}
              maxLength={128}
              required
              className={classNames(INPUT, "w-full max-w-64")}
            />
            <Button type="submit" variant="outline" size="xs" disabled={busy || !current || !next}>
              {busy ? "Changing…" : "Change password"}
            </Button>
            {message && (
              <p
                role={message.ok ? "status" : "alert"}
                className={classNames(
                  "text-xs font-semibold",
                  message.ok ? "text-lime-700" : "text-pmred-dark"
                )}
              >
                {message.text}
              </p>
            )}
          </form>
        ))}
    </div>
  );
}

const AVATAR_MAX_CHARS = 150 * 1024; // the server takes up to 120 KB of image data

// Downscale an uploaded photo to a 256px square JPEG (small enough to store with the
// account).
function readAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        canvas.getContext("2d").drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        for (const quality of [0.85, 0.7, 0.5]) {
          const url = canvas.toDataURL("image/jpeg", quality);
          if (url.length <= AVATAR_MAX_CHARS) return resolve(url);
        }
        reject(new Error("too large"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-z0-9._-]{3,30}$/;

export default function SettingsModal({ open, onClose, tab: initialTab = "general" }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const [session] = useSessionContext();
  const router = useRouter();
  const member = session.user;
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(() => ({ ...state.settings }));
  const [profile, setProfile] = useState(() => ({
    name: member?.name || "",
    username: member?.username || "",
    email: member?.email || "",
    location: member?.location || "",
    avatar: member?.avatarUrl || ""
  }));
  const [editing, setEditing] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false); // a chosen photo is being resized
  const [avatarUrlOpen, setAvatarUrlOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const avatarJob = useRef(0); // only the latest chosen photo counts
  // What the pop-up opened with, to save only the fields changed here.
  const [initial] = useState(() => ({ settings: { ...draft }, profile: { ...profile } }));
  const [blockName, setBlockName] = useState("");

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleEdit = (field) => setEditing((current) => (current === field ? null : field));
  const editProfile = (patch) => {
    setProfile((p) => ({ ...p, ...patch }));
    setProfileError("");
  };

  function showProfileError(field, message) {
    setTab("general");
    if (field) setEditing(field);
    setProfileError(message);
  }

  async function accept() {
    if (avatarBusy || saving) return;
    const cleaned = {
      ...profile,
      name: profile.name.trim(),
      username: profile.username.trim().toLowerCase(),
      email: profile.email.trim(),
      location: profile.location.trim(),
      avatar: profile.avatar.trim()
    };
    const profilePatch = member
      ? Object.fromEntries(
          ["name", "username", "email", "location", "avatar"]
            .filter((key) => cleaned[key] !== initial.profile[key])
            .map((key) => [key, cleaned[key]])
        )
      : {};
    // Nothing is saved until the profile fields are valid.
    if (member) {
      if (!cleaned.name) return showProfileError("name", "Please enter your name.");
      if (!USERNAME.test(cleaned.username))
        return showProfileError(
          "username",
          "Usernames are 3–30 letters, numbers, dots, dashes or underscores."
        );
      if (!EMAIL.test(cleaned.email))
        return showProfileError("email", "Please enter a valid e-mail address.");
      if (cleaned.avatar && !/^(https:\/\/|data:image\/)/.test(cleaned.avatar))
        return showProfileError(null, "The photo must be a full https:// image URL.");
    }
    if (Object.keys(profilePatch).length) {
      setSaving(true);
      const result = await session.updateProfile(profilePatch);
      setSaving(false);
      if (!result.ok) {
        const field = ["username", "email", "name"].find((key) =>
          result.error.toLowerCase().includes(key === "name" ? "name" : key)
        );
        return showProfileError(field || null, result.error);
      }
    }
    const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
    const settingsPatch = Object.fromEntries(
      Object.entries(draft).filter(
        ([key, value]) => key !== "blockedUsers" && changed(value, initial.settings[key])
      )
    );
    // Blocked users are saved as additions/removals against the latest list.
    const blockedBefore = initial.settings.blockedUsers;
    const blocked = draft.blockedUsers.filter((name) => !blockedBefore.includes(name));
    const unblocked = blockedBefore.filter((name) => !draft.blockedUsers.includes(name));
    if (Object.keys(settingsPatch).length) actions.updateSettings(settingsPatch);
    if (blocked.length || unblocked.length) actions.updateBlockedUsers(blocked, unblocked);
    const hasSettings =
      Object.keys(settingsPatch).length > 0 || blocked.length > 0 || unblocked.length > 0;
    if (hasSettings || Object.keys(profilePatch).length) toast.success("Settings saved");
    onClose();
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again still counts
    if (!file) return;
    const job = ++avatarJob.current;
    setAvatarBusy(true);
    try {
      const avatar = await readAvatar(file);
      if (job === avatarJob.current) editProfile({ avatar });
    } catch {
      if (job === avatarJob.current) toast.error("That image couldn't be read.");
    } finally {
      if (job === avatarJob.current) setAvatarBusy(false);
    }
  }

  function blockUser(e) {
    e.preventDefault();
    const name = blockName.trim();
    if (!name || draft.blockedUsers.includes(name)) return;
    set({ blockedUsers: [...draft.blockedUsers, name] });
    setBlockName("");
  }

  const avatarShown = profile.avatar || initialsAvatar(profile.name);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      size="lg"
      headerExtra={
        <TabList
          idBase="settings"
          label="Settings sections"
          tabs={TABS}
          value={tab}
          onChange={setTab}
          className="flex items-center gap-2"
          tabClassName={(selected) =>
            classNames(
              "rounded-full border px-4 py-1 text-2xs font-bold uppercase tracking-wider transition",
              selected
                ? "border-neutral-300 text-neutral-500"
                : "border-transparent text-pmred hover:border-pmred/30"
            )
          }
        />
      }
      footerStart={
        <button
          type="button"
          onClick={() => openModal("reset")}
          className="text-2xs font-bold uppercase tracking-wider text-neutral-500 transition hover:text-pmred"
        >
          Clear data on this device
        </button>
      }
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={accept} disabled={avatarBusy || saving}>
            {avatarBusy ? "Processing photo…" : saving ? "Saving…" : "Accept"}
          </Button>
        </>
      }
    >
      <div className="min-h-72" {...tabPanelProps("settings", tab)}>
        {tab === "general" && (
          <div className="divide-y divide-neutral-200">
            {member ? (
              <div className="flex flex-col-reverse gap-6 pb-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 divide-y divide-neutral-200">
                  <EditableRow
                    label="Name"
                    value={profile.name}
                    editing={editing === "name"}
                    onEdit={() => toggleEdit("name")}
                    onChange={(name) => editProfile({ name })}
                  />
                  <EditableRow
                    label="Username"
                    value={profile.username}
                    editing={editing === "username"}
                    onEdit={() => toggleEdit("username")}
                    onChange={(username) => editProfile({ username })}
                  />
                  <EditableRow
                    label="E-mail"
                    type="email"
                    value={profile.email}
                    editing={editing === "email"}
                    onEdit={() => toggleEdit("email")}
                    onChange={(email) => editProfile({ email })}
                  />
                  <EditableRow
                    label="Location"
                    value={profile.location}
                    placeholder="City, country"
                    editing={editing === "location"}
                    onEdit={() => toggleEdit("location")}
                    onChange={(location) => editProfile({ location })}
                  />
                  <PasswordRow
                    open={editing === "password"}
                    onToggle={() => toggleEdit("password")}
                    isDemo={member.isDemo}
                  />
                  {profileError && (
                    <p
                      role="alert"
                      className="py-3 text-right text-xs font-semibold text-pmred-dark"
                    >
                      {profileError}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 self-center sm:w-40">
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <span className="relative h-24 w-24 overflow-hidden bg-neutral-100">
                      <Image
                        src={avatarShown}
                        alt="Your photo"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </span>
                    <span className="text-2xs font-bold uppercase tracking-wider text-pmred">
                      Upload your photo
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={onAvatar} />
                  </label>
                  <div className="flex gap-3 text-2xs font-bold tracking-wider">
                    <button
                      type="button"
                      onClick={() => setAvatarUrlOpen((v) => !v)}
                      aria-expanded={avatarUrlOpen}
                      className="uppercase text-neutral-500 hover:text-pmred"
                    >
                      Image URL
                    </button>
                    {profile.avatar && (
                      <button
                        type="button"
                        onClick={() => editProfile({ avatar: "" })}
                        className="uppercase text-neutral-500 hover:text-pmred"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {avatarUrlOpen && (
                    <input
                      type="url"
                      value={profile.avatar.startsWith("data:") ? "" : profile.avatar}
                      onChange={(e) => editProfile({ avatar: e.target.value })}
                      placeholder="https://…"
                      aria-label="Photo URL"
                      autoFocus
                      className={classNames(INPUT, "w-full")}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
                <p className="text-sm text-neutral-600">
                  Log in to edit your profile, photo and password.
                </p>
                <Button href={loginHref(router.asPath)} size="xs" onClick={onClose}>
                  Log in
                </Button>
              </div>
            )}
            <ToggleRow
              label="Publicly displayed as online / Available to chat"
              checked={draft.availableToChat}
              onChange={(v) => set({ availableToChat: v })}
            />
            <ToggleRow
              label="DNA icon + information for each song"
              checked={draft.showSongDNA}
              onChange={(v) => set({ showSongDNA: v })}
            />
            <ToggleRow
              label="Pop up messaging"
              checked={draft.popupMessaging}
              onChange={(v) => set({ popupMessaging: v })}
            />
            <ToggleRow
              label="Single-key shortcuts (P, B, M, 1–3, ?)"
              checked={draft.characterShortcuts}
              onChange={(v) => set({ characterShortcuts: v })}
            />
          </div>
        )}

        {tab === "security" && (
          <div>
            <p className="mb-2 text-sm text-neutral-700">Blocked user list</p>
            {draft.blockedUsers.length ? (
              <ul className="divide-y divide-neutral-200">
                {draft.blockedUsers.map((name, i) => (
                  <li key={name} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="mr-6 text-neutral-700">{pad2(i + 1)}.</span>
                      <span className="text-pmred">{name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set({ blockedUsers: draft.blockedUsers.filter((x) => x !== name) })
                      }
                      className="text-2xs font-bold uppercase tracking-wider text-pmred hover:text-pmred-dark"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-neutral-500">You haven&apos;t blocked anyone.</p>
            )}
            <form onSubmit={blockUser} className="mt-4 flex gap-3">
              <input
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Block a username"
                aria-label="Username to block"
                className="h-9 flex-1 rounded-full border border-neutral-200 px-4 text-sm placeholder:text-neutral-300 focus:border-pmred focus:outline-none"
              />
              <Button type="submit" variant="outline" size="xs">
                Block
              </Button>
            </form>
            <div className="mt-4 border-t border-neutral-200">
              <ToggleRow
                label="Do not show messages from blocked users"
                checked={draft.hideBlockedMessages}
                onChange={(v) => set({ hideBlockedMessages: v })}
              />
            </div>
          </div>
        )}

        {tab === "playlist" && (
          <div className="divide-y divide-neutral-200">
            <ToggleRow
              label="Share timeline publicly"
              checked={draft.shareTimeline}
              onChange={(v) => set({ shareTimeline: v })}
            />
            <ToggleRow
              label="Share playlist publicly"
              checked={draft.sharePlaylist}
              onChange={(v) => set({ sharePlaylist: v })}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
