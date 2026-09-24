import { useEffect, useSyncExternalStore } from "react";

// Client cache of comment threads (/api/comments), shared by every component showing
// a thread or its count, so posting in a thread updates its count everywhere.
//
//   threads: threadId -> { comments: [...] | null, error: string | null }
//   counts:  threadId -> number (batched count requests for lists of threads)

const threads = new Map();
const counts = new Map();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setThread(threadId, patch) {
  threads.set(threadId, { comments: null, error: null, ...threads.get(threadId), ...patch });
  const comments = threads.get(threadId).comments;
  if (comments) counts.set(threadId, comments.length);
  emit();
}

function updateComments(threadId, update) {
  const comments = threads.get(threadId)?.comments;
  if (comments) setThread(threadId, { comments: update(comments) });
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    return { ok: false, status: 0, data: { error: "You seem to be offline. Try again." } };
  }
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function send(method, url, body) {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
}

const loading = new Map(); // threadId -> in-flight load

export function loadThread(threadId) {
  if (!loading.has(threadId)) {
    const job = request(`/api/comments?thread=${encodeURIComponent(threadId)}`).then(
      ({ ok, data }) => {
        loading.delete(threadId);
        if (ok) setThread(threadId, { comments: data.comments || [], error: null });
        else setThread(threadId, { error: data.error || "Comments couldn't be loaded." });
      }
    );
    loading.set(threadId, job);
  }
  return loading.get(threadId);
}

// The thread's comments (null until loaded) and load error. Reloads when `viewerKey`
// (the logged-in member) changes, since "mine" depends on who is asking.
export function useThread(threadId, viewerKey) {
  const thread = useSyncExternalStore(
    subscribe,
    () => threads.get(threadId),
    () => undefined
  );
  useEffect(() => {
    loadThread(threadId);
  }, [threadId, viewerKey]);
  return { comments: thread?.comments ?? null, error: thread?.error ?? null };
}

// ---------------------------------------------------------------- counts

let pending = new Set();
let timer = null;

async function flushCounts() {
  const ids = [...pending];
  pending = new Set();
  timer = null;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const query = chunk.map((id) => `count=${encodeURIComponent(id)}`).join("&");
    const { ok, data } = await request(`/api/comments?${query}`);
    if (!ok) continue;
    for (const [threadId, count] of Object.entries(data.counts || {})) {
      if (!threads.get(threadId)?.comments) counts.set(threadId, count);
    }
    emit();
  }
}

// Number of comments in a thread (null until known). Counts of many threads on one
// page are fetched together.
export function useCommentCount(threadId) {
  const count = useSyncExternalStore(
    subscribe,
    () => counts.get(threadId) ?? null,
    () => null
  );
  useEffect(() => {
    if (counts.has(threadId) || threads.get(threadId)?.comments) return;
    pending.add(threadId);
    timer ??= setTimeout(flushCounts, 0);
  }, [threadId]);
  return count;
}

// ---------------------------------------------------------------- changes

// Each resolves to { ok, comment?, error?, status? }.
export async function postComment(threadId, text) {
  const { ok, status, data } = await send("POST", "/api/comments", { thread: threadId, text });
  if (!ok) return { ok, status, error: data.error || "Your comment couldn't be posted." };
  if (threads.get(threadId)?.comments) {
    updateComments(threadId, (comments) => [data.comment, ...comments]);
  } else {
    counts.set(threadId, (counts.get(threadId) || 0) + 1);
    emit();
  }
  return { ok, comment: data.comment };
}

// Saves an edit made from `expected` (the text the editor opened with). A comment
// changed meanwhile resolves to { conflict: true, text } with the newer text.
export async function editComment(threadId, id, text, expected) {
  const url = `/api/comments/${encodeURIComponent(id)}`;
  const { ok, status, data } = await send("PATCH", url, { text, expected });
  if (status === 409 && data.conflict) return { ok: false, conflict: true, text: data.text };
  if (status === 404) updateComments(threadId, (comments) => comments.filter((c) => c.id !== id));
  if (!ok) return { ok, status, error: data.error || "Your changes couldn't be saved." };
  updateComments(threadId, (comments) => comments.map((c) => (c.id === id ? data.comment : c)));
  return { ok, comment: data.comment };
}

export async function deleteComment(threadId, id) {
  const { ok, status, data } = await send("DELETE", `/api/comments/${encodeURIComponent(id)}`);
  if (ok || status === 404) {
    updateComments(threadId, (comments) => comments.filter((c) => c.id !== id));
  }
  if (!ok) return { ok, status, error: data.error || "The comment couldn't be deleted." };
  return { ok };
}
