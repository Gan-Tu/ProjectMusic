import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useStore } from "../../lib/store";
import { useSessionContext } from "../../lib/SessionProvider";
import { classNames, pad2, timeAgo } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { getSeedComments } from "../../utils/getFakeComments";
import UndoBar from "../ui/UndoBar";

const MAX_LENGTH = 1000;

// Visible comments of a thread: the user's own (newest first) + seeded ones not removed.
export function useThreadComments(threadId, { seed, seedCount } = {}) {
  const { state } = useStore();
  const seeded = useMemo(
    () => seed ?? getSeedComments(threadId, seedCount),
    [seed, threadId, seedCount]
  );
  const mine = state.comments[threadId] || [];
  return [...mine, ...seeded.filter((c) => !state.hiddenComments[c.id])];
}

function Avatar({ src, name, compact }) {
  const size = compact ? "h-7 w-7" : "h-10 w-10";
  return (
    <span
      className={classNames("relative shrink-0 overflow-hidden rounded-full bg-neutral-200", size)}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
          unoptimized={src.startsWith("data:")}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-2xs font-bold uppercase text-neutral-500">
          {name?.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

function ActionButton({ children, onClick, danger, dark, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "text-2xs font-bold uppercase tracking-wider transition",
        danger
          ? "text-pmred hover:text-pmred-dark"
          : dark
            ? "text-neutral-400 hover:text-white"
            : "text-neutral-500 hover:text-neutral-800"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CommentItem({
  comment,
  threadId,
  loggedIn,
  canModerate,
  compact,
  dark,
  now,
  onReply,
  onDeleted
}) {
  const { state, actions } = useStore();
  const [mode, setMode] = useState("view"); // "view" | "edit" | "confirm"
  const [draft, setDraft] = useState(comment.text);
  // Text the edit started from, to notice changes saved meanwhile (e.g. in another tab).
  const [editBase, setEditBase] = useState(comment.text);
  const likeId = `comment:${comment.id}`;
  const liked = Boolean(state.likes[likeId]);
  const likes = (comment.likes || 0) + (liked ? 1 : 0);
  // Editing and deleting need an active session (moderation also needs the admin role).
  const canEdit = loggedIn && comment.mine;
  const canDelete = loggedIn && (comment.mine || canModerate);
  const editing = mode === "edit" && canEdit;
  const confirming = mode === "confirm" && canDelete;

  // Keep keyboard focus with the action: into the confirmation, and back to Edit or
  // Delete when editing or confirming ends.
  const editRef = useRef(null);
  const deleteRef = useRef(null);
  const confirmRef = useRef(null);
  const previousMode = useRef(mode);
  useEffect(() => {
    const previous = previousMode.current;
    previousMode.current = mode;
    if (mode === "confirm") confirmRef.current?.focus();
    else if (previous === "confirm") deleteRef.current?.focus();
    else if (previous === "edit") editRef.current?.focus();
  }, [mode]);

  function startEdit() {
    setDraft(comment.text);
    setEditBase(comment.text);
    setMode("edit");
  }

  function remove() {
    if (!canDelete) return;
    const undo = actions.deleteComment(threadId, comment);
    setMode("view");
    onDeleted({ message: comment.mine ? "Comment deleted" : "Comment removed", run: undo });
  }

  const [saving, setSaving] = useState(false);
  async function save(e) {
    e?.preventDefault();
    if (!canEdit) {
      setMode("view");
      return;
    }
    if (!draft.trim() || saving) return;
    if (draft.trim() === editBase) {
      setMode("view");
      return;
    }
    // Checked against the latest saved comment (another tab may have edited it).
    setSaving(true);
    const result = await actions.editComment(threadId, comment.id, draft, editBase);
    setSaving(false);
    if (result.conflict) {
      setEditBase(result.text);
      toast("This comment was changed elsewhere. Review it, then save again to overwrite.");
      return;
    }
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Comment updated");
    setMode("view");
  }

  return (
    <li className={classNames("flex gap-3", compact ? "py-2.5" : "gap-4 py-5")}>
      <Avatar src={comment.avatar} name={comment.author} compact={compact} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-xs font-bold text-pmred">{comment.author}</span>
          <span
            className={classNames(
              "text-2xs uppercase tracking-wider",
              dark ? "text-neutral-400" : "text-neutral-500"
            )}
          >
            {comment.label || timeAgo(comment.at, now || undefined)}
            {comment.editedAt && " · edited"}
          </span>
        </p>

        {editing ? (
          <form onSubmit={save} className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setMode("view");
                  setDraft(comment.text);
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(e);
              }}
              autoFocus
              rows={compact ? 2 : 3}
              aria-label="Edit comment"
              className={classNames(
                "w-full rounded-2xl border px-4 py-2 text-sm focus:border-pmred focus:outline-none",
                dark
                  ? "border-neutral-700 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white"
              )}
            />
            <div className="flex gap-4">
              <ActionButton type="submit" danger onClick={save} disabled={!draft.trim()}>
                Save
              </ActionButton>
              <ActionButton
                dark={dark}
                onClick={() => {
                  setMode("view");
                  setDraft(comment.text);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : (
          <p
            className={classNames(
              "mt-1 whitespace-pre-wrap break-words",
              dark ? "text-neutral-300" : "text-neutral-600",
              compact ? "text-xs leading-5" : "text-sm leading-relaxed"
            )}
          >
            {comment.text}
          </p>
        )}

        {confirming ? (
          <div
            role="alertdialog"
            aria-label="Confirm delete"
            className={classNames(
              "mt-2 flex flex-wrap items-center gap-4 text-xs",
              dark ? "text-neutral-300" : "text-neutral-600"
            )}
          >
            {comment.mine ? "Delete this comment?" : "Remove this comment for everyone?"}
            <ActionButton danger onClick={remove} ref={confirmRef}>
              {comment.mine ? "Delete" : "Remove"}
            </ActionButton>
            <ActionButton dark={dark} onClick={() => setMode("view")}>
              Cancel
            </ActionButton>
          </div>
        ) : (
          !editing && (
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                aria-pressed={liked}
                aria-label={liked ? "Unlike comment" : "Like comment"}
                onClick={() => actions.toggleLike(likeId)}
                className={classNames(
                  "flex items-center gap-1 text-2xs font-bold transition",
                  liked
                    ? "text-pmred"
                    : dark
                      ? "text-neutral-400 hover:text-pmred"
                      : "text-neutral-500 hover:text-pmred"
                )}
              >
                {liked ? (
                  <HeartSolidIcon className="h-3.5 w-3.5" />
                ) : (
                  <HeartIcon className="h-3.5 w-3.5" />
                )}
                {likes > 0 && likes}
              </button>
              <ActionButton dark={dark} onClick={() => onReply(comment.author)}>
                Reply
              </ActionButton>
              {canEdit && (
                <ActionButton dark={dark} onClick={startEdit} ref={editRef}>
                  Edit
                </ActionButton>
              )}
              {canDelete && (
                <ActionButton danger onClick={() => setMode("confirm")} ref={deleteRef}>
                  {comment.mine ? "Delete" : "Remove"}
                </ActionButton>
              )}
            </div>
          )
        )}
      </div>
    </li>
  );
}

// Persisted comment thread with add / edit / delete (+ undo) / like / reply.
// The logged-in user is the site admin, so they may also remove others' comments.
// Keyed by thread so drafts never leak when the same component switches threads.
export default function CommentThread(props) {
  return <Thread key={props.threadId} {...props} />;
}

function Thread({
  threadId,
  seed,
  seedCount,
  title = "Conversation",
  compact = false,
  placeholder = "What are you hearing?",
  dark = false,
  className
}) {
  const { actions } = useStore();
  const [session, dispatch] = useSessionContext();
  const user = session.user;
  const comments = useThreadComments(threadId, { seed, seedCount });
  const now = useNow(); // one clock per thread keeps "5 minutes ago" labels current
  const headingRef = useRef(null); // where focus goes when an Undo notice closes
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [undo, setUndo] = useState(null);
  const inputRef = useRef(null);
  const limit = compact ? 3 : 5;
  const shown = showAll ? comments : comments.slice(0, limit);
  const canModerate = user?.role === "Administrator";

  function post(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !user) return;
    actions.addComment(threadId, { text, author: user.name, avatar: user.avatar });
    setDraft("");
    toast.success("Comment posted");
  }

  function reply(author) {
    setDraft((d) => (d.startsWith(`@${author}`) ? d : `@${author} ${d}`));
    inputRef.current?.focus();
  }

  const form = user ? (
    <form
      onSubmit={post}
      className={classNames("flex gap-3", compact ? "items-center" : "items-start")}
    >
      <Avatar src={user.avatar} name={user.name} compact={compact} />
      <div className="min-w-0 flex-1">
        {compact ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={placeholder}
              aria-label="Write a comment"
              className={classNames(
                "h-9 min-w-0 flex-1 rounded-full border px-4 text-sm focus:border-pmred focus:outline-none",
                dark
                  ? "border-neutral-700 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white"
              )}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-pmred px-4 text-2xs font-bold uppercase tracking-wider text-white transition hover:bg-pmred-dark disabled:opacity-40"
            >
              Post
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(e);
              }}
              rows={3}
              placeholder={placeholder}
              aria-label="Write a comment"
              className={classNames(
                "w-full rounded-2xl border px-4 py-3 text-sm focus:border-pmred focus:outline-none focus:ring-2 focus:ring-pmred/15",
                dark
                  ? "border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-600"
                  : "border-neutral-200 bg-white placeholder:text-neutral-300"
              )}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className={dark ? "text-2xs text-neutral-400" : "text-2xs text-neutral-500"}>
                {draft.length}/{MAX_LENGTH} · Ctrl/⌘ + Enter to post
              </span>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-full bg-pmred px-6 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-pmred-dark disabled:opacity-40"
              >
                Post comment
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  ) : (
    <p className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
      Log in to join the conversation.
      <button
        type="button"
        onClick={() => dispatch({ type: "set_user", user: {} })}
        className="font-bold uppercase tracking-wider text-pmred"
      >
        Login
      </button>
    </p>
  );

  return (
    <section className={className} aria-label={title}>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className={classNames(
          "outline-none",
          "font-extrabold uppercase tracking-widest",
          compact ? "mb-3 text-2xs" : "mb-6 text-sm"
        )}
      >
        {title} <span className="text-pmred">{pad2(comments.length)}</span>
      </h2>
      {form}
      {undo && (
        <UndoBar
          key={undo.id}
          message={undo.message}
          onUndo={undo.run}
          onDone={() => setUndo(null)}
          returnFocusTo={headingRef}
          className="mt-4"
        />
      )}
      {comments.length ? (
        <ul
          className={classNames(
            "divide-y",
            dark ? "divide-neutral-800" : "divide-neutral-200",
            compact ? "mt-2" : "mt-4"
          )}
          aria-live="polite"
        >
          {shown.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              threadId={threadId}
              loggedIn={Boolean(user)}
              canModerate={canModerate}
              compact={compact}
              dark={dark}
              now={now}
              onReply={reply}
              onDeleted={(entry) => setUndo({ ...entry, id: Date.now() })}
            />
          ))}
        </ul>
      ) : (
        <p className={classNames("mt-4 text-sm", dark ? "text-neutral-400" : "text-neutral-500")}>
          Be the first to add your voice.
        </p>
      )}
      {comments.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-2xs font-bold uppercase tracking-wider text-pmred"
        >
          {showAll ? "Show fewer" : `Show all ${comments.length} comments`}
        </button>
      )}
    </section>
  );
}
