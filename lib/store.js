import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";
import toast from "react-hot-toast";
import { CHAT_REPLIES, DEFAULT_CHATS } from "../utils/getFakeChats";
import { DEFAULT_NOTIFICATIONS } from "../utils/getFakeNotifications";

// Client-side app state for the single-user demo, persisted to localStorage.
//
// Cart / purchase item shape:
//   { id, name, image, kind, price, credits, grantsCredits, options, subtitle }
//   - price: USD price or null when the item can only be bought with credits
//   - credits: credit price or null when it can only be bought with a card
//   - grantsCredits: credits added to the balance when bought (credit packs)
//   - options: e.g. { size: "M", color: "Black" } (part of the cart line key)

// Stored as { rev, data }. `rev` increases with every write so a tab can tell when
// another tab saved newer data and rebase its own unsaved actions on top of it.
const STORAGE_KEY = "pm-store-v2";

export const MAX_QTY = 99;

const PERSISTED_KEYS = [
  "credits",
  "points",
  "cart",
  "purchases",
  "likes",
  "follows",
  "playlist",
  "settings",
  "notifications",
  "chats",
  "subscriptions",
  "feedback",
  "rsvps",
  "comments",
  "hiddenComments",
  "sentMessages"
];

export const initialState = {
  hydrated: false,
  credits: 3740,
  points: 21665,
  cart: [],
  purchases: [],
  likes: {},
  follows: {},
  playlist: [],
  settings: {
    availableToChat: true,
    showSongDNA: false,
    popupMessaging: true,
    hideBlockedMessages: true,
    shareTimeline: true,
    sharePlaylist: true,
    quickCreditPurchase: false,
    blockedUsers: ["SorryX", "AngelMC", "TestQuest", "CurseSoul"]
  },
  notifications: DEFAULT_NOTIFICATIONS,
  chats: DEFAULT_CHATS,
  subscriptions: { newsletter: null, sms: null, volunteer: null },
  feedback: [],
  rsvps: {},
  // User comments per thread: { [threadId]: [{ id, author, avatar, text, at, editedAt? }] }
  comments: {},
  // Seeded (other people's) comments removed by the admin user: { [commentId]: true }
  hiddenComments: {},
  // Contact-form messages "sent" to the studio: [{ id, at, name, email, subject, message }]
  sentMessages: []
};

export function cartKey(id, options) {
  const opts = Object.entries(options || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return opts ? `${id}?${opts}` : String(id);
}

export function cartTotals(items) {
  return items.reduce(
    (acc, item) => {
      acc.count += item.qty;
      if (item.price != null) acc.usd += item.price * item.qty;
      if (item.credits != null) acc.credits += item.credits * item.qty;
      else acc.creditsPayable = false;
      if (item.price == null) acc.cardPayable = false;
      return acc;
    },
    { count: 0, usd: 0, credits: 0, creditsPayable: true, cardPayable: true }
  );
}

function toggleKey(map, id) {
  const next = { ...map };
  if (next[id]) delete next[id];
  else next[id] = true;
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "reset":
      return { ...initialState, hydrated: true };

    case "cart/add": {
      const key = cartKey(action.item.id, action.item.options);
      const exists = state.cart.some((line) => line.key === key);
      const cart = exists
        ? state.cart.map((line) =>
            line.key === key ? { ...line, qty: Math.min(MAX_QTY, line.qty + action.qty) } : line
          )
        : [...state.cart, { ...action.item, key, qty: Math.min(MAX_QTY, Math.max(1, action.qty)) }];
      return { ...state, cart };
    }
    case "cart/qty":
      return {
        ...state,
        cart: state.cart.map((line) =>
          line.key === action.key
            ? { ...line, qty: Math.max(1, Math.min(MAX_QTY, action.qty)) }
            : line
        )
      };
    case "cart/remove":
      return { ...state, cart: state.cart.filter((line) => line.key !== action.key) };
    case "cart/clear":
      return { ...state, cart: [] };

    case "purchase": {
      const { purchase } = action;
      if (purchase.totalCredits > state.credits) return state;
      return {
        ...state,
        credits: state.credits - purchase.totalCredits + purchase.creditsGranted,
        points: state.points + purchase.pointsEarned,
        purchases: [purchase, ...state.purchases],
        cart: action.fromCart ? [] : state.cart,
        notifications: [
          {
            id: `n-${purchase.id}`,
            type: "shop",
            text: `Your order ${purchase.id} is confirmed.`,
            highlight: purchase.id,
            href: "/profile?tab=purchased",
            at: purchase.date,
            read: false
          },
          ...state.notifications
        ]
      };
    }
    case "credits/add":
      return { ...state, credits: state.credits + action.amount };

    case "like/toggle":
      return { ...state, likes: toggleKey(state.likes, action.id) };
    case "follow/toggle":
      return { ...state, follows: toggleKey(state.follows, action.id) };
    case "rsvp/toggle":
      return { ...state, rsvps: toggleKey(state.rsvps, action.id) };

    case "playlist/add":
      if (state.playlist.some((t) => t.id === action.track.id)) return state;
      return { ...state, playlist: [...state.playlist, action.track] };
    case "playlist/remove":
      return { ...state, playlist: state.playlist.filter((t) => t.id !== action.id) };
    case "playlist/clear":
      return { ...state, playlist: [] };

    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "notifications/add":
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case "notifications/dismiss":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id)
      };
    case "notifications/clear":
      return { ...state, notifications: [] };
    case "notifications/read":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      };

    case "chat/message":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId
            ? {
                ...chat,
                unread: action.message.from === "them" ? chat.unread + 1 : chat.unread,
                messages: [...chat.messages, action.message]
              }
            : chat
        )
      };
    case "chat/start":
      if (state.chats.some((chat) => chat.id === action.chat.id)) return state;
      return {
        ...state,
        chats: [{ online: true, unread: 0, messages: [], ...action.chat }, ...state.chats]
      };
    case "chat/delete-message":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId
            ? { ...chat, messages: chat.messages.filter((m) => m.id !== action.messageId) }
            : chat
        )
      };
    case "chat/delete":
      return { ...state, chats: state.chats.filter((chat) => chat.id !== action.chatId) };
    case "chat/read":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId ? { ...chat, unread: 0 } : chat
        )
      };

    case "subscribe":
      return {
        ...state,
        subscriptions: { ...state.subscriptions, [action.kind]: action.value }
      };
    case "contact/save":
      return { ...state, sentMessages: [action.entry, ...state.sentMessages] };
    case "feedback/add":
      return { ...state, feedback: [action.entry, ...state.feedback] };
    case "feedback/restore":
      if (state.feedback.some((f) => f.id === action.entry.id)) return state;
      return {
        ...state,
        feedback: [...state.feedback, action.entry].sort((a, b) => (a.at < b.at ? 1 : -1))
      };
    case "feedback/delete":
      return { ...state, feedback: state.feedback.filter((f) => f.id !== action.id) };

    case "comment/add": {
      const thread = state.comments[action.threadId] || [];
      if (thread.some((c) => c.id === action.comment.id)) return state;
      const index = action.index ?? thread.length;
      const next = [...thread.slice(0, index), action.comment, ...thread.slice(index)];
      return { ...state, comments: { ...state.comments, [action.threadId]: next } };
    }
    case "comment/edit":
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.threadId]: (state.comments[action.threadId] || []).map((c) =>
            c.id === action.id ? { ...c, text: action.text, editedAt: action.at } : c
          )
        }
      };
    case "comment/delete":
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.threadId]: (state.comments[action.threadId] || []).filter(
            (c) => c.id !== action.id
          )
        }
      };
    case "comment/hide":
      return { ...state, hiddenComments: { ...state.hiddenComments, [action.id]: true } };
    case "comment/unhide": {
      const hiddenComments = { ...state.hiddenComments };
      delete hiddenComments[action.id];
      return { ...state, hiddenComments };
    }
    default:
      throw new Error(`Unknown store action: ${action.type}`);
  }
}

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isCount = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isPrice = (v) => v == null || isCount(v);
const hasId = (v) => isObject(v) && typeof v.id === "string";
const isDate = (v) =>
  (typeof v === "string" || typeof v === "number") && !Number.isNaN(new Date(v).getTime());
const listOf = (value, valid) => (Array.isArray(value) ? value.filter(valid) : undefined);

// Saved data is checked field by field: anything malformed (an old build, a
// hand-edited value) falls back to its default instead of crashing the app.
const VALIDATORS = {
  credits: (v) => (isCount(v) ? v : undefined),
  points: (v) => (isCount(v) ? v : undefined),
  cart: (v) =>
    listOf(
      v,
      (line) =>
        hasId(line) &&
        typeof line.key === "string" &&
        typeof line.name === "string" &&
        Number.isInteger(line.qty) &&
        line.qty >= 1 &&
        line.qty <= MAX_QTY &&
        isPrice(line.price) &&
        isPrice(line.credits)
    ),
  purchases: (v) =>
    listOf(
      v,
      (p) =>
        hasId(p) &&
        isDate(p.date) &&
        Array.isArray(p.items) &&
        p.items.every((item) => isObject(item) && typeof item.name === "string")
    ),
  likes: (v) => (isObject(v) ? v : undefined),
  follows: (v) => (isObject(v) ? v : undefined),
  rsvps: (v) => (isObject(v) ? v : undefined),
  hiddenComments: (v) => (isObject(v) ? v : undefined),
  playlist: (v) => listOf(v, (t) => hasId(t) && typeof t.title === "string"),
  settings: (v) => {
    if (!isObject(v)) return undefined;
    const settings = { ...initialState.settings };
    for (const [key, fallback] of Object.entries(initialState.settings)) {
      if (key === "blockedUsers") {
        if (Array.isArray(v.blockedUsers))
          settings.blockedUsers = v.blockedUsers.filter((name) => typeof name === "string");
      } else if (typeof v[key] === typeof fallback) {
        settings[key] = v[key];
      }
    }
    return settings;
  },
  subscriptions: (v) => {
    if (!isObject(v)) return undefined;
    const subscriptions = { ...initialState.subscriptions, ...v };
    // The sign-up pop-ups prefill their fields from these.
    for (const kind of ["newsletter", "sms"]) {
      const entry = subscriptions[kind];
      const valid =
        entry === null ||
        (isObject(entry) && typeof entry.name === "string" && typeof entry.value === "string");
      if (!valid) subscriptions[kind] = null;
    }
    return subscriptions;
  },
  notifications: (v) => listOf(v, (n) => hasId(n) && typeof n.text === "string"),
  chats: (v) => {
    const chats = listOf(v, (chat) => hasId(chat) && typeof chat.name === "string");
    return chats
      ? mergeLegacyChats(
          chats.map((chat) => ({
            ...chat,
            unread: isCount(chat.unread) ? chat.unread : 0,
            messages: listOf(chat.messages, (m) => hasId(m) && typeof m.text === "string") || []
          }))
        )
      : undefined;
  },
  feedback: (v) => listOf(v, (f) => hasId(f) && typeof f.text === "string" && isDate(f.at)),
  comments: (v) =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, thread]) => Array.isArray(thread))
            .map(([threadId, thread]) => [
              threadId,
              thread.filter((c) => hasId(c) && typeof c.text === "string")
            ])
        )
      : undefined,
  sentMessages: (v) => listOf(v, hasId)
};

function normalizePersisted(saved) {
  const payload = {};
  if (!isObject(saved)) return payload;
  for (const key of PERSISTED_KEYS) {
    const value = saved[key] === undefined ? undefined : VALIDATORS[key](saved[key]);
    if (value !== undefined) payload[key] = value;
  }
  return payload;
}

// Older builds prefixed artist conversations with "artist-"; fold them into the
// canonical id (merging histories) so one person never has two conversations.
function mergeLegacyChats(chats) {
  const byId = new Map();
  for (const chat of chats) {
    const id = chat.id.startsWith("artist-") ? chat.id.slice("artist-".length) : chat.id;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { ...chat, id });
      continue;
    }
    const seen = new Set(existing.messages.map((m) => m.id));
    byId.set(id, {
      ...existing,
      unread: existing.unread + chat.unread,
      messages: [...existing.messages, ...chat.messages.filter((m) => !seen.has(m.id))]
    });
  }
  return [...byId.values()];
}

function readStored() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return { rev: Number(parsed?.rev) || 0, data: parsed?.data ?? null };
  } catch {
    return { rev: 0, data: null };
  }
}

function pickPersisted(state) {
  const data = {};
  for (const key of PERSISTED_KEYS) data[key] = state[key];
  return data;
}

// A stored snapshot with `actions` replayed on top: how a tab rebases its unsaved
// changes onto data another tab saved in the meantime.
function rebase(storedData, actions) {
  let next = { ...initialState, ...normalizePersisted(storedData), hydrated: true };
  for (const action of actions) next = reducer(next, action);
  return next;
}

// Conversations the user can see (hides blocked users when that setting is on).
export function visibleChats(state) {
  const blocked = state.settings.hideBlockedMessages ? state.settings.blockedUsers : [];
  return state.chats.filter((chat) => !blocked.includes(chat.name));
}

// Wraps an undo callback so it only runs once (toast buttons can be double-clicked).
function once(fn) {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    fn();
  };
}

const StoreContext = createContext(null);

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Runs `fn` while holding a cross-tab lock, so each read-rebase-write cycle (and
// each checkout's validate-and-commit) is atomic across open tabs.
function withStoreLock(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("pm-store", fn);
  }
  return Promise.resolve().then(fn);
}

function writeStored(rev, data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rev, data }));
    return true;
  } catch {
    return false; // storage unavailable (private mode, quota): keep working in memory
  }
}

export function StoreProvider({ children }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const pending = useRef([]); // actions applied locally but not written yet
  const replyTimers = useRef([]);
  const resetGeneration = useRef(0); // invalidates simulated replies after a reset
  const warnedUnsaved = useRef(false);

  // Storage full or blocked: keep working in memory and tell the user once.
  const warnUnsaved = useCallback(() => {
    if (warnedUnsaved.current) return;
    warnedUnsaved.current = true;
    toast.error("Changes can't be saved in this browser (storage is full or blocked).");
  }, []);

  // User actions are recorded so they can be replayed onto newer data from another tab.
  const dispatch = useCallback((action) => {
    pending.current.push(action);
    baseDispatch(action);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Show `data` (committed) plus any actions dispatched since, without a render if
  // nothing changed.
  const showCommitted = useCallback((data) => {
    const next = pickPersisted(rebase(data, pending.current));
    if (JSON.stringify(next) !== JSON.stringify(pickPersisted(stateRef.current))) {
      baseDispatch({ type: "hydrate", payload: next });
    }
  }, []);

  // Write unsaved actions on top of the latest stored data (another tab may have
  // saved meanwhile), under the cross-tab lock.
  const flush = useCallback(
    () =>
      withStoreLock(() => {
        const batch = pending.current.slice();
        if (!batch.length) return;
        const stored = readStored();
        const data = pickPersisted(rebase(stored.data, batch));
        const changed = JSON.stringify(stored.data) !== JSON.stringify(data);
        if (changed && !writeStored(stored.rev + 1, data)) {
          // Not saved: keep the actions pending so the in-memory state stays
          // authoritative (and they're retried with the next change).
          warnUnsaved();
          return;
        }
        pending.current = pending.current.slice(batch.length);
        showCommitted(data);
      }),
    [showCommitted, warnUnsaved]
  );

  // Load persisted state after mount (so the first client render matches SSR) and
  // follow saves from other tabs, keeping any local actions that aren't saved yet.
  useEffect(() => {
    const stored = readStored();
    baseDispatch({ type: "hydrate", payload: pickPersisted(rebase(stored.data, pending.current)) });

    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      showCommitted(readStored().data);
    };
    window.addEventListener("storage", onStorage);
    const timers = replyTimers.current;
    return () => {
      window.removeEventListener("storage", onStorage);
      timers.forEach(clearTimeout);
    };
  }, [showCommitted]);

  useEffect(() => {
    if (state.hydrated && pending.current.length) flush();
  }, [state, flush]);

  // Validates against the newest saved state and commits the purchase atomically.
  // Resolves to { ok, error?, purchase? } once the order is saved.
  const checkout = useCallback(
    (method, explicitItems) =>
      withStoreLock(() => {
        const stored = readStored();
        const batch = pending.current.slice();
        const current = rebase(stored.data, batch);
        const items = (explicitItems || current.cart).map((item) => ({ qty: 1, ...item }));
        if (!items.length) return { ok: false, error: "Your cart is empty." };
        const totals = cartTotals(items);
        if (method === "credits") {
          const blocked = items.find((i) => i.credits == null);
          if (blocked) return { ok: false, error: `${blocked.name} can't be paid with credits.` };
          if (totals.credits > current.credits)
            return { ok: false, error: "You don't have enough credits for this purchase." };
        } else {
          const blocked = items.find((i) => i.price == null);
          if (blocked)
            return { ok: false, error: `${blocked.name} can only be paid with credits.` };
        }
        const creditsGranted = items.reduce((sum, i) => sum + (i.grantsCredits || 0) * i.qty, 0);
        const purchase = {
          id: `PM-${Date.now().toString(36).toUpperCase()}`,
          date: new Date().toISOString(),
          method,
          items,
          totalUsd: method === "card" ? totals.usd : 0,
          totalCredits: method === "credits" ? totals.credits : 0,
          creditsGranted,
          pointsEarned: Math.round(method === "card" ? totals.usd * 10 : totals.credits / 2)
        };
        const purchaseAction = { type: "purchase", purchase, fromCart: !explicitItems };
        const data = pickPersisted(reducer(current, purchaseAction));
        if (writeStored(stored.rev + 1, data)) {
          pending.current = pending.current.slice(batch.length);
          showCommitted(data);
        } else {
          // Not saved: apply it in memory (pending, retried with the next change).
          dispatch(purchaseAction);
          warnUnsaved();
        }
        return { ok: true, purchase };
      }),
    [dispatch, showCommitted, warnUnsaved]
  );

  const sendMessage = useCallback(
    (chatId, text) => {
      const body = text.trim();
      if (!body) return;
      dispatch({
        type: "chat/message",
        chatId,
        message: { id: makeId("m"), from: "me", text: body, at: new Date().toISOString() }
      });
      // Simulated reply so the chat feels alive in the demo.
      const generation = resetGeneration.current;
      const timer = setTimeout(
        () => {
          if (generation !== resetGeneration.current) return;
          const reply = CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
          dispatch({
            type: "chat/message",
            chatId,
            message: { id: makeId("m"), from: "them", text: reply, at: new Date().toISOString() }
          });
        },
        1200 + Math.random() * 1500
      );
      replyTimers.current.push(timer);
    },
    [dispatch]
  );

  const resetDemo = useCallback(() => {
    resetGeneration.current += 1;
    replyTimers.current.forEach(clearTimeout);
    replyTimers.current.length = 0;
    dispatch({ type: "reset" });
  }, [dispatch]);

  const actions = useMemo(
    () => ({
      addToCart: (item, qty = 1) => dispatch({ type: "cart/add", item, qty }),
      updateCartQty: (key, qty) => dispatch({ type: "cart/qty", key, qty }),
      removeFromCart: (key) => dispatch({ type: "cart/remove", key }),
      clearCart: () => dispatch({ type: "cart/clear" }),
      // method: "credits" | "card"; items: optional list for "buy now" (bypasses the cart)
      checkout,
      addCredits: (amount) => dispatch({ type: "credits/add", amount }),
      toggleLike: (id) => dispatch({ type: "like/toggle", id }),
      toggleFollow: (id) => dispatch({ type: "follow/toggle", id }),
      toggleRsvp: (id) => dispatch({ type: "rsvp/toggle", id }),
      addToPlaylist: (track) => dispatch({ type: "playlist/add", track }),
      removeFromPlaylist: (id) => dispatch({ type: "playlist/remove", id }),
      clearPlaylist: () => dispatch({ type: "playlist/clear" }),
      updateSettings: (patch) => dispatch({ type: "settings/update", patch }),
      addNotification: (notification) =>
        dispatch({
          type: "notifications/add",
          notification: {
            id: makeId("n"),
            at: new Date().toISOString(),
            read: false,
            ...notification
          }
        }),
      markNotificationsRead: () => dispatch({ type: "notifications/read" }),
      dismissNotification: (id) => dispatch({ type: "notifications/dismiss", id }),
      clearNotifications: () => dispatch({ type: "notifications/clear" }),
      sendMessage,
      // chat: { id, name, avatar } — no-op if a conversation with that id exists
      startChat: (chat) => dispatch({ type: "chat/start", chat }),
      markChatRead: (chatId) => dispatch({ type: "chat/read", chatId }),
      deleteMessage: (chatId, messageId) =>
        dispatch({ type: "chat/delete-message", chatId, messageId }),
      deleteChat: (chatId) => dispatch({ type: "chat/delete", chatId }),
      // kind: "newsletter" | "sms" | "volunteer"
      subscribe: (kind, value) => dispatch({ type: "subscribe", kind, value }),
      addFeedback: (text) =>
        dispatch({
          type: "feedback/add",
          entry: { id: makeId("f"), text, at: new Date().toISOString() }
        }),
      deleteFeedback: (id) => dispatch({ type: "feedback/delete", id }),
      saveContactMessage: (fields) =>
        dispatch({
          type: "contact/save",
          entry: { id: makeId("cm"), at: new Date().toISOString(), ...fields }
        }),
      restoreFeedback: (entry) => dispatch({ type: "feedback/restore", entry }),
      // Comments. `author`/`avatar` come from the logged-in user.
      addComment: (threadId, { text, author, avatar }) => {
        const comment = {
          id: makeId("c"),
          author,
          avatar,
          text: text.trim(),
          at: new Date().toISOString(),
          mine: true
        };
        dispatch({ type: "comment/add", threadId, comment, index: 0 });
        return comment;
      },
      editComment: (threadId, id, text) =>
        dispatch({
          type: "comment/edit",
          threadId,
          id,
          text: text.trim(),
          at: new Date().toISOString()
        }),
      // Own comments are removed; seeded comments are hidden (admin moderation).
      // Returns a one-shot undo function.
      deleteComment: (threadId, comment) => {
        if (comment.mine) {
          const thread = stateRef.current.comments[threadId] || [];
          const index = thread.findIndex((c) => c.id === comment.id);
          dispatch({ type: "comment/delete", threadId, id: comment.id });
          return once(() =>
            dispatch({ type: "comment/add", threadId, comment, index: Math.max(0, index) })
          );
        }
        dispatch({ type: "comment/hide", id: comment.id });
        return once(() => dispatch({ type: "comment/unhide", id: comment.id }));
      },
      // Empties the cart and returns a one-shot undo.
      clearCartWithUndo: () => {
        const saved = stateRef.current.cart;
        dispatch({ type: "cart/clear" });
        return once(() =>
          saved.forEach((line) => dispatch({ type: "cart/add", item: line, qty: line.qty }))
        );
      },
      resetDemo
    }),
    [dispatch, checkout, sendMessage, resetDemo]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
