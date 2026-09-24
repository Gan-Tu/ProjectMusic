import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
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

function EditableRow({ label, value, type = "text", editing, onEdit, onChange, display }) {
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
        <span className="truncate text-right text-sm text-pmred">{display ?? value}</span>
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
  const [session, dispatch] = useSessionContext();
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(() => ({ ...state.settings }));
  const [profile, setProfile] = useState(() => ({
    username: session.user?.username || "",
    email: session.user?.email || "",
    password: "",
    avatar: session.user?.avatar
  }));
  const [editing, setEditing] = useState(null);
  const [blockName, setBlockName] = useState("");

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleEdit = (field) => setEditing((current) => (current === field ? null : field));

  function accept() {
    actions.updateSettings(draft);
    if (session.user) {
      dispatch({
        type: "update_user",
        patch: { username: profile.username, email: profile.email, avatar: profile.avatar }
      });
    }
    toast.success(profile.password ? "Settings and password updated" : "Settings saved");
    onClose();
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const avatar = await readAvatar(file);
      setProfile((p) => ({ ...p, avatar }));
    } catch {
      toast.error("That image couldn't be read.");
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
        <div role="tablist" className="flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={classNames(
                "rounded-full border px-4 py-1 text-2xs font-bold uppercase tracking-wider transition",
                tab === t.id
                  ? "border-neutral-300 text-neutral-400"
                  : "border-transparent text-pmred hover:border-pmred/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
      footerStart={
        <button
          type="button"
          onClick={() => openModal("reset")}
          className="text-2xs font-bold uppercase tracking-wider text-neutral-400 transition hover:text-pmred"
        >
          Reset demo data
        </button>
      }
      footer={
        <>
          <Button variant="muted" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </>
      }
    >
      <div className="min-h-72">
        {tab === "general" && (
          <div className="divide-y divide-neutral-200">
            <div className="flex flex-col-reverse gap-6 pb-3 sm:flex-row sm:items-start">
              <div className="flex-1 divide-y divide-neutral-200">
                <EditableRow
                  label="Username"
                  value={profile.username}
                  editing={editing === "username"}
                  onEdit={() => toggleEdit("username")}
                  onChange={(username) => setProfile((p) => ({ ...p, username }))}
                />
                <EditableRow
                  label="E-mail"
                  type="email"
                  value={profile.email}
                  editing={editing === "email"}
                  onEdit={() => toggleEdit("email")}
                  onChange={(email) => setProfile((p) => ({ ...p, email }))}
                />
                <EditableRow
                  label="Password"
                  type="password"
                  value={profile.password}
                  display="••••••••"
                  editing={editing === "password"}
                  onEdit={() => toggleEdit("password")}
                  onChange={(password) => setProfile((p) => ({ ...p, password }))}
                />
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
              <p className="py-6 text-sm text-neutral-400">You haven&apos;t blocked anyone.</p>
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
