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
import { eventStartsAt } from "../utils/eventSchedule";

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
  "sentMessages",
  "generation"
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
  sentMessages: [],
  // Bumped by every "Reset demo data" (in any tab); simulated chat replies scheduled
  // before a reset carry the old value and are dropped.
  generation: 0
};

// A ticket whose event has started can't be bought any more. Tickets saved before
// they carried the start time are looked up by their event id ("ticket:<id>").
export function salesEnded(item, now = Date.now()) {
  if (item?.kind !== "ticket") return false;
  const startsAt = item.startsAt || eventStartsAt(String(item.id).replace(/^ticket:/, ""));
  return Boolean(startsAt) && Date.parse(startsAt) <= now;
}

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
  // Actions tagged with a generation (simulated chat replies, undos) belong to the
  // data from before a demo reset: after a reset in any tab they're dropped.
  if (action.generation !== undefined && action.generation !== state.generation) return state;
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "reset":
      return { ...initialState, generation: state.generation + 1, hydrated: true };

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
    // A step (+1 / -1) rather than a new total, so steps taken in two tabs at once
    // both count when their changes are merged.
    case "cart/step":
      return {
        ...state,
        cart: state.cart.map((line) =>
          line.key === action.key
            ? { ...line, qty: Math.max(1, Math.min(MAX_QTY, line.qty + action.delta)) }
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
    // Block/unblock as changes (not a whole new list), so edits made in two tabs
    // both apply when replayed onto the latest settings.
    case "settings/blocked": {
      const blockedUsers = state.settings.blockedUsers.filter(
        (name) => !action.remove.includes(name)
      );
      for (const name of action.add) if (!blockedUsers.includes(name)) blockedUsers.push(name);
      return { ...state, settings: { ...state.settings, blockedUsers } };
    }

    case "notifications/add":
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case "notifications/dismiss":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id)
      };
    case "notifications/clear":
      return { ...state, notifications: [] };
    case "notifications/read-one":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id && !n.read ? { ...n, read: true } : n
        )
      };
    case "notifications/read":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      };

    case "chat/message":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          // A reply scheduled for a conversation that was since deleted (and maybe
          // started again) doesn't belong in the new one.
          chat.id === action.chatId &&
          !("chatSession" in action && (chat.session ?? null) !== action.chatSession)
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
  sentMessages: (v) => listOf(v, hasId),
  generation: (v) => (Number.isInteger(v) && v >= 0 ? v : undefined)
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

// What a cart checkout charges for: each line's key, quantity and prices.
function cartSignature(lines) {
  return JSON.stringify(
    lines.map(({ key, qty, price, credits }) => [key, qty, price ?? null, credits ?? null]).sort()
  );
}

// A stored snapshot with `actions` replayed on top: how a tab rebases its unsaved
// changes onto data another tab saved in the meantime.
function rebase(storedData, actions) {
  let next = { ...initialState, ...normalizePersisted(storedData), hydrated: true };
  for (const action of actions) next = reducer(next, action);
  return next;
}

// Whether conversations with `name` are hidden: blocked, with "Do not show messages
// from blocked users" on.
export function isHiddenContact(state, name) {
  return state.settings.hideBlockedMessages && state.settings.blockedUsers.includes(name);
}

// Conversations the user can see.
export function visibleChats(state) {
  return state.chats.filter((chat) => !isHiddenContact(state, chat.name));
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
  // For a cart checkout, `confirmedCart` is the cart the user saw when confirming.
  // Resolves to { ok, error?, purchase? } once the order is saved.
  const checkout = useCallback(
    (method, explicitItems, confirmedCart) =>
      withStoreLock(() => {
        const stored = readStored();
        const batch = pending.current.slice();
        const current = rebase(stored.data, batch);
        // The cart may change while this waits for the lock (another tab, or a
        // click): only charge for exactly what the user confirmed.
        if (confirmedCart && cartSignature(current.cart) !== cartSignature(confirmedCart)) {
          return { ok: false, error: "Your cart changed. Please review it and check out again." };
        }
        const items = (explicitItems || current.cart).map((item) => ({ qty: 1, ...item }));
        if (!items.length) return { ok: false, error: "Your cart is empty." };
        const ended = items.find((item) => salesEnded(item));
        if (ended) {
          return {
            ok: false,
            error: `Ticket sales for ${ended.name} have ended. Remove it to check out.`
          };
        }
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
      // Simulated reply so the chat feels alive in the demo. It belongs to the
      // current generation: a reset (here or in another tab) before it arrives drops
      // it, even when it's replayed onto data another tab saved.
      const generation = stateRef.current.generation;
      const sessionOf = () =>
        stateRef.current.chats.find((chat) => chat.id === chatId)?.session ?? null;
      const chatSession = sessionOf();
      const timer = setTimeout(
        () => {
          if (generation !== stateRef.current.generation || sessionOf() !== chatSession) return;
          const reply = CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
          dispatch({
            type: "chat/message",
            chatId,
            generation,
            chatSession,
            message: { id: makeId("m"), from: "them", text: reply, at: new Date().toISOString() }
          });
        },
        1200 + Math.random() * 1500
      );
      replyTimers.current.push(timer);
    },
    [dispatch]
  );

  // A one-shot undo whose actions carry the current generation, so it can't bring
  // back data after a demo reset (here or in another tab).
  const makeUndo = useCallback(
    (restore) => {
      const generation = stateRef.current.generation;
      return once(() => restore((action) => dispatch({ ...action, generation })));
    },
    [dispatch]
  );

  const resetDemo = useCallback(() => {
    replyTimers.current.forEach(clearTimeout);
    replyTimers.current.length = 0;
    dispatch({ type: "reset" });
  }, [dispatch]);

  const actions = useMemo(
    () => ({
      // Returns how many were added: each cart line holds at most MAX_QTY.
      addToCart: (item, qty = 1) => {
        if (salesEnded(item)) return 0;
        const key = cartKey(item.id, item.options);
        const inCart = stateRef.current.cart.find((line) => line.key === key)?.qty || 0;
        const added = Math.max(0, Math.min(qty, MAX_QTY - inCart));
        if (added) dispatch({ type: "cart/add", item, qty: added });
        return added;
      },
      stepCartQty: (key, delta) => dispatch({ type: "cart/step", key, delta }),
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
      updateSettings: (patch) => dispatch({ type: "settings/update", patch }),
      updateBlockedUsers: (add, remove) => dispatch({ type: "settings/blocked", add, remove }),
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
      markNotificationRead: (id) => dispatch({ type: "notifications/read-one", id }),
      dismissNotification: (id) => dispatch({ type: "notifications/dismiss", id }),
      clearNotifications: () => dispatch({ type: "notifications/clear" }),
      sendMessage,
      // chat: { id, name, avatar } — no-op if a conversation with that id exists
      // Each conversation gets its own token (see "chat/message").
      startChat: (chat) =>
        dispatch({ type: "chat/start", chat: { session: makeId("c"), ...chat } }),
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
      saveContactMessage: (fields) =>
        dispatch({
          type: "contact/save",
          entry: { id: makeId("cm"), at: new Date().toISOString(), ...fields }
        }),
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
          return makeUndo((send) =>
            send({ type: "comment/add", threadId, comment, index: Math.max(0, index) })
          );
        }
        dispatch({ type: "comment/hide", id: comment.id });
        return makeUndo((send) => send({ type: "comment/unhide", id: comment.id }));
      },
      // Empties the cart and returns a one-shot undo.
      clearCartWithUndo: () => {
        const saved = stateRef.current.cart;
        dispatch({ type: "cart/clear" });
        return makeUndo((send) =>
          saved.forEach((line) => send({ type: "cart/add", item: line, qty: line.qty }))
        );
      },
      // Empties the saved playlist and returns a one-shot undo.
      clearPlaylistWithUndo: () => {
        const saved = stateRef.current.playlist;
        dispatch({ type: "playlist/clear" });
        return makeUndo((send) => saved.forEach((track) => send({ type: "playlist/add", track })));
      },
      // Deletes a feedback entry and returns a one-shot undo.
      deleteFeedbackWithUndo: (entry) => {
        dispatch({ type: "feedback/delete", id: entry.id });
        return makeUndo((send) => send({ type: "feedback/restore", entry }));
      },
      resetDemo
    }),
    [dispatch, checkout, sendMessage, resetDemo, makeUndo]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
