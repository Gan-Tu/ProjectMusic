import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { TabList, tabPanelProps } from "../ui/Tabs";
import { Toggle } from "../ui/Form";
import { useStore } from "../../lib/store";
import { useSessionContext } from "../../lib/SessionProvider";
import { useUI } from "../../lib/ui";
import { classNames, pad2 } from "../../lib/format";

const TABS = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "playlist", label: "Playlist" }
];

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <span className="text-sm text-neutral-700">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function EditableRow({ label, value, type = "text", editing, onEdit, onChange }) {
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
          className="h-8 min-w-0 rounded-full border border-neutral-200 px-3 text-right text-sm focus:border-pmred focus:outline-none"
        />
      ) : (
        <span className="truncate text-right text-sm text-pmred">{value}</span>
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

// Demo access takes any password (see the login page), so there's none to change:
// "Edit" explains that instead of offering a field that would be ignored.
function PasswordRow({ open, onToggle }) {
  return (
    <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 py-3.5">
      <span className="text-sm text-neutral-700">Password</span>
      {open ? (
        <span className="text-right text-xs text-neutral-500">
          Demo access: any password signs you in, so there&apos;s nothing to change.
        </span>
      ) : (
        <span className="truncate text-right text-sm text-pmred">••••••••</span>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="text-2xs font-bold uppercase tracking-wider text-pmred hover:text-pmred-dark"
      >
        {open ? "Done" : "Edit"}
      </button>
    </div>
  );
}

// Downscale an uploaded photo so it fits comfortably in localStorage.
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
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function SettingsModal({ open, onClose, tab: initialTab = "general" }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const [session] = useSessionContext();
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(() => ({ ...state.settings }));
  const [profile, setProfile] = useState(() => ({
    username: session.user?.username || "",
    email: session.user?.email || "",
    avatar: session.user?.avatar
  }));
  const [editing, setEditing] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false); // a chosen photo is being resized
  const avatarJob = useRef(0); // only the latest chosen photo counts
  // What the pop-up opened with, to save only the fields changed here.
  const [initial] = useState(() => ({ settings: { ...draft }, profile: { ...profile } }));
  const [blockName, setBlockName] = useState("");

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleEdit = (field) => setEditing((current) => (current === field ? null : field));

  async function accept() {
    if (avatarBusy) return;
    // Nothing is saved until the profile fields are valid (logged in: they're shown).
    const username = profile.username.trim();
    const email = profile.email.trim();
    const invalid = !session.user
      ? null
      : !username
        ? ["username", "Please enter a username."]
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? ["email", "Please enter a valid e-mail address."]
          : null;
    if (invalid) {
      setTab("general");
      setEditing(invalid[0]);
      setProfileError(invalid[1]);
      return;
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
    const hasSettings =
      Object.keys(settingsPatch).length > 0 || blocked.length > 0 || unblocked.length > 0;
    if (Object.keys(settingsPatch).length) actions.updateSettings(settingsPatch);
    if (blocked.length || unblocked.length) actions.updateBlockedUsers(blocked, unblocked);
    const cleaned = { ...profile, username, email };
    const profilePatch = Object.fromEntries(
      ["username", "email", "avatar"]
        .filter((key) => cleaned[key] !== initial.profile[key])
        .map((key) => [key, cleaned[key]])
    );
    const hasProfile = Boolean(session.user) && Object.keys(profilePatch).length > 0;
    if (hasProfile && !(await session.updateProfile(profilePatch))) {
      toast.error(
        "Profile updated for this visit only: this browser won't save it (storage is full or blocked)."
      );
    } else if (hasSettings || hasProfile) {
      toast.success("Settings saved");
    }
    onClose();
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const job = ++avatarJob.current;
    setAvatarBusy(true);
    try {
      const avatar = await readAvatar(file);
      if (job === avatarJob.current) setProfile((p) => ({ ...p, avatar }));
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
          Reset demo data
        </button>
      }
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={accept} disabled={avatarBusy}>
            {avatarBusy ? "Processing photo…" : "Accept"}
          </Button>
        </>
      }
    >
      <div className="min-h-72" {...tabPanelProps("settings", tab)}>
        {tab === "general" && (
          <div className="divide-y divide-neutral-200">
            <div className="flex flex-col-reverse gap-6 pb-3 sm:flex-row sm:items-start">
              <div className="flex-1 divide-y divide-neutral-200">
                <EditableRow
                  label="Username"
                  value={profile.username}
                  editing={editing === "username"}
                  onEdit={() => toggleEdit("username")}
                  onChange={(username) => {
                    setProfile((p) => ({ ...p, username }));
                    setProfileError("");
                  }}
                />
                <EditableRow
                  label="E-mail"
                  type="email"
                  value={profile.email}
                  editing={editing === "email"}
                  onEdit={() => toggleEdit("email")}
                  onChange={(email) => {
                    setProfile((p) => ({ ...p, email }));
                    setProfileError("");
                  }}
                />
                <PasswordRow
                  open={editing === "password"}
                  onToggle={() => toggleEdit("password")}
                />
                {profileError && (
                  <p role="alert" className="py-3 text-right text-xs font-semibold text-pmred-dark">
                    {profileError}
                  </p>
                )}
              </div>
              <label className="flex cursor-pointer flex-col items-center gap-2 self-center">
                <span className="relative h-24 w-24 overflow-hidden bg-neutral-100">
                  {profile.avatar && (
                    <Image
                      src={profile.avatar}
                      alt="Your photo"
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized={profile.avatar.startsWith("data:")}
                    />
                  )}
                </span>
                <span className="text-2xs font-bold uppercase tracking-wider text-pmred">
                  Upload your photo
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={onAvatar} />
              </label>
            </div>
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
