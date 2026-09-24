import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "../ui/SmartImage";
import toast from "react-hot-toast";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useStore } from "../../lib/store";
import { loginHref, useSessionContext } from "../../lib/SessionProvider";
import { classNames, pad2, timeAgo } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import UndoBar from "../ui/UndoBar";
import {
  deleteComment,
  editComment,
  postComment,
  useCommentCount,
  useThread
} from "./commentsStore";

const MAX_LENGTH = 1000;

// Number of comments in a thread, for "Comment (3)" style labels (null until known).
export { useCommentCount };

function Avatar({ src, name, compact }) {
  const size = compact ? "h-7 w-7" : "h-10 w-10";
  return (
    <span
      className={classNames("relative shrink-0 overflow-hidden rounded-full bg-neutral-200", size)}
    >
      {src ? (
        <Image src={src} alt="" fill sizes="40px" className="object-cover" />
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
        "text-2xs font-bold uppercase tracking-wider transition disabled:opacity-40",
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

function CommentItem({ comment, threadId, loggedIn, compact, dark, now, onReply, onDeleted }) {
  const { state, actions } = useStore();
  const [mode, setMode] = useState("view"); // "view" | "edit" | "confirm"
  const [draft, setDraft] = useState(comment.text);
  // Text the edit started from, to notice changes saved meanwhile (e.g. in another tab).
  const [editBase, setEditBase] = useState(comment.text);
  // Likes are this browser's toggle on top of the stored count.
  const likeId = `comment:${comment.id}`;
  const liked = Boolean(state.likes[likeId]);
  const likes = (comment.likes || 0) + (liked ? 1 : 0);
  // Members edit and delete their own comments (moderation happens in the CRM).
  const canChange = loggedIn && comment.mine;
  const editing = mode === "edit" && canChange;
  const confirming = mode === "confirm" && canChange;

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

  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!canChange || busy) return;
    setBusy(true);
    const result = await deleteComment(threadId, comment.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      setMode("view");
      return;
    }
    onDeleted(comment);
  }

  // The newer saved text when the comment changed during this edit (e.g. in another
  // tab): shown next to the draft until the user picks a version.
  const [conflict, setConflict] = useState(null);
  async function save(e, { overwrite = false } = {}) {
    e?.preventDefault();
    if (!canChange) {
      setMode("view");
      return;
    }
    if (!draft.trim() || busy || (conflict !== null && !overwrite)) return;
    const base = overwrite ? conflict : editBase;
    if (draft.trim() === base) {
      setConflict(null);
      setMode("view");
      return;
    }
    // Checked against the latest saved comment on the server.
    setBusy(true);
    const result = await editComment(threadId, comment.id, draft, base);
    setBusy(false);
    if (result.conflict) {
      setConflict(result.text);
      return;
    }
    setConflict(null);
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
          <span className="min-w-0 text-xs font-bold text-pmred wrap-anywhere">
            {comment.author}
          </span>
          <time
            dateTime={comment.at}
            className={classNames(
              "text-2xs uppercase tracking-wider",
              dark ? "text-neutral-400" : "text-neutral-500"
            )}
          >
            {timeAgo(comment.at, now || undefined)}
            {comment.editedAt && " · edited"}
          </time>
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
                  setConflict(null);
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
            {conflict !== null && (
              <div
                role="alert"
                className={classNames(
                  "border px-4 py-3 text-xs",
                  dark
                    ? "border-neutral-700 bg-neutral-900 text-neutral-300"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700"
                )}
              >
                <p className="font-semibold">Meanwhile, this comment was changed to:</p>
                <p className="mt-1 whitespace-pre-wrap wrap-anywhere">{conflict}</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  <ActionButton
                    dark={dark}
                    onClick={() => {
                      setDraft(conflict);
                      setEditBase(conflict);
                      setConflict(null);
                    }}
                  >
                    Use this version
                  </ActionButton>
                  <ActionButton danger onClick={(e) => save(e, { overwrite: true })}>
                    Save mine instead
                  </ActionButton>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <ActionButton
                type="submit"
                danger
                onClick={save}
                disabled={!draft.trim() || conflict !== null || busy}
              >
                {busy ? "Saving…" : "Save"}
              </ActionButton>
              <ActionButton
                dark={dark}
                onClick={() => {
                  setMode("view");
                  setDraft(comment.text);
                  setConflict(null);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          </form>
        ) : (
          <p
            className={classNames(
              "mt-1 whitespace-pre-wrap wrap-anywhere",
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
            Delete this comment?
            <ActionButton danger onClick={remove} disabled={busy} ref={confirmRef}>
              Delete
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
              {loggedIn && (
                <ActionButton dark={dark} onClick={() => onReply(comment.author)}>
                  Reply
                </ActionButton>
              )}
              {canChange && (
                <>
                  <ActionButton dark={dark} onClick={startEdit} ref={editRef}>
                    Edit
                  </ActionButton>
                  <ActionButton danger onClick={() => setMode("confirm")} ref={deleteRef}>
                    Delete
                  </ActionButton>
                </>
              )}
            </div>
          )
        )}
      </div>
    </li>
  );
}

// A comment thread (stored on the server, visible to everyone): members post, reply,
// edit and delete their own comments (with Undo); guests read along and get a link to
// log in. Keyed by thread so drafts never leak when the same component switches threads.
export default function CommentThread(props) {
  return <Thread key={props.threadId} {...props} />;
}

function Thread({
  threadId,
  title = "Conversation",
  compact = false,
  placeholder = "What are you hearing?",
  dark = false,
  className
}) {
  const [session] = useSessionContext();
  const router = useRouter();
  const user = session.user;
  const { comments, error } = useThread(threadId, user?.id || "guest");
  const list = comments || [];
  const now = useNow(); // one clock per thread keeps "5 minutes ago" labels current
  const headingRef = useRef(null); // where focus goes when an Undo notice closes
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [undo, setUndo] = useState(null);
  const inputRef = useRef(null);
  const limit = compact ? 3 : 5;
  const shown = showAll ? list : list.slice(0, limit);

  async function post(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !user || posting) return;
    setPosting(true);
    const result = await postComment(threadId, text);
    setPosting(false);
    if (!result.ok) {
      toast.error(
        result.status === 401 ? "Your session ended. Log in again to comment." : result.error
      );
      return;
    }
    setDraft("");
    toast.success("Comment posted");
  }

  function reply(author) {
    setDraft((d) => (d.startsWith(`@${author}`) ? d : `@${author} ${d}`));
    inputRef.current?.focus();
  }

  // Undo puts the text back as a new comment.
  function deleted(comment) {
    setUndo({
      id: Date.now(),
      message: "Comment deleted",
      run: async () => {
        const result = await postComment(threadId, comment.text);
        if (!result.ok) toast.error(result.error);
      }
    });
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
              disabled={!draft.trim() || posting}
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
                disabled={!draft.trim() || posting}
                className="rounded-full bg-pmred px-6 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-pmred-dark disabled:opacity-40"
              >
                {posting ? "Posting…" : "Post comment"}
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  ) : (
    <p
      className={classNames(
        "flex flex-wrap items-center gap-3 text-xs",
        dark ? "text-neutral-400" : "text-neutral-500"
      )}
    >
      Join the conversation.
      <Link
        href={loginHref(router.asPath)}
        className="font-bold uppercase tracking-wider text-pmred hover:underline"
      >
        Log in to comment
      </Link>
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
        {title} <span className="text-pmred">{pad2(list.length)}</span>
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
      {list.length ? (
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
              compact={compact}
              dark={dark}
              now={now}
              onReply={reply}
              onDeleted={deleted}
            />
          ))}
        </ul>
      ) : (
        <p
          role={error ? "alert" : undefined}
          className={classNames("mt-4 text-sm", dark ? "text-neutral-400" : "text-neutral-500")}
        >
          {error || (comments ? "Be the first to add your voice." : "Loading comments…")}
        </p>
      )}
      {list.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-2xs font-bold uppercase tracking-wider text-pmred"
        >
          {showAll ? "Show fewer" : `Show all ${list.length} comments`}
        </button>
      )}
    </section>
  );
}
