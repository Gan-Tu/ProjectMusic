import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";
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
  "hiddenComments"
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
  hiddenComments: {}
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

function normalizePersisted(saved) {
  const payload = {};
  if (!saved || typeof saved !== "object") return payload;
  for (const key of PERSISTED_KEYS) {
    if (saved[key] !== undefined) payload[key] = saved[key];
  }
  if (payload.settings) payload.settings = { ...initialState.settings, ...payload.settings };
  if (payload.subscriptions)
    payload.subscriptions = { ...initialState.subscriptions, ...payload.subscriptions };
  return payload;
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

export function StoreProvider({ children }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const syncedRev = useRef(0); // storage revision our state is based on
  const pending = useRef([]); // actions applied locally but not written yet
  const replyTimers = useRef([]);

  // User actions are recorded so they can be replayed onto newer data from another tab.
  const dispatch = useCallback((action) => {
    pending.current.push(action);
    baseDispatch(action);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted state after mount (so the first client render matches SSR) and
  // follow saves from other tabs, keeping any local actions that aren't saved yet.
  useEffect(() => {
    const stored = readStored();
    syncedRev.current = stored.rev;
    baseDispatch({ type: "hydrate", payload: pickPersisted(rebase(stored.data, pending.current)) });

    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const latest = readStored();
      syncedRev.current = latest.rev;
      baseDispatch({
        type: "hydrate",
        payload: pickPersisted(rebase(latest.data, pending.current))
      });
    };
    window.addEventListener("storage", onStorage);
    const timers = replyTimers.current;
    return () => {
      window.removeEventListener("storage", onStorage);
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const stored = readStored();
      let data = pickPersisted(state);
      if (stored.rev !== syncedRev.current) {
        // Another tab saved since our last sync: replay our unsaved actions on top of it.
        data = pickPersisted(rebase(stored.data, pending.current));
        baseDispatch({ type: "hydrate", payload: data });
      }
      pending.current = [];
      syncedRev.current = stored.rev;
      if (JSON.stringify(stored.data) !== JSON.stringify(data)) {
        syncedRev.current = stored.rev + 1;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rev: syncedRev.current, data }));
      }
    } catch {
      // Storage can be unavailable (private mode, quota); the app still works in memory.
    }
  }, [state]);

  const checkout = useCallback(
    (method, explicitItems) => {
      // Validate against the newest saved state: another tab may have spent credits.
      let current = stateRef.current;
      const stored = readStored();
      if (stored.data && stored.rev !== syncedRev.current) {
        current = rebase(stored.data, pending.current);
      }
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
        if (blocked) return { ok: false, error: `${blocked.name} can only be paid with credits.` };
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
      dispatch({ type: "purchase", purchase, fromCart: !explicitItems });
      return { ok: true, purchase };
    },
    [dispatch]
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
      const timer = setTimeout(
        () => {
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
      resetDemo: () => dispatch({ type: "reset" })
    }),
    [dispatch, checkout, sendMessage]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
