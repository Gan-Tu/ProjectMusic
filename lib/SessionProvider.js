import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";

// Single-user demo: "logging in" just restores this profile.
export const DEFAULT_USER = {
  name: "Nick Breton",
  username: "Propeller",
  email: "info@truthstudios.com",
  role: "Administrator",
  avatar: "https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg"
};

// v2 stores the profile separately from the login flag, so logging out keeps edits.
const STORAGE_KEY = "pm-session-v2";

const Context = createContext();

const initialState = {
  profile: DEFAULT_USER,
  loggedIn: true,
  hydrated: false
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    // Log in (restores the saved profile; `user` can add details, e.g. from sign-up).
    case "set_user":
      return { ...state, loggedIn: true, profile: { ...state.profile, ...action.user } };
    case "update_user":
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case "unset_user":
      return { ...state, loggedIn: false };
    // Back to the original demo profile (used by "Reset demo data").
    case "reset":
      return { ...initialState, hydrated: true };
    default:
      throw new Error(`Unknown session action: ${action.type}`);
  }
}

function parseSession(raw) {
  try {
    const saved = JSON.parse(raw || "null");
    if (saved && typeof saved === "object") {
      // Keep only well-formed profile fields (corrupt values fall back to the defaults).
      const profile = { ...DEFAULT_USER };
      if (saved.profile && typeof saved.profile === "object") {
        for (const [key, value] of Object.entries(saved.profile)) {
          if (typeof value === "string") profile[key] = value;
        }
      }
      return { profile, loggedIn: saved.loggedIn !== false };
    }
  } catch {
    // ignore corrupt storage
  }
  return {};
}

// Returns false when the browser won't store it (private mode, quota).
function writeSession(profile, loggedIn) {
  try {
    const json = JSON.stringify({ profile, loggedIn });
    if (window.localStorage.getItem(STORAGE_KEY) !== json) {
      window.localStorage.setItem(STORAGE_KEY, json);
    }
    return true;
  } catch {
    return false;
  }
}

// Serializes session writes across tabs (read-merge-write must not interleave).
function withSessionLock(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("pm-session", fn);
  }
  return Promise.resolve().then(fn);
}

function readSession() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  // The session as this tab knows it, kept in step synchronously (unlike `state`).
  const known = useRef({ profile: initialState.profile, loggedIn: initialState.loggedIn });
  const unsaved = useRef(false); // the last write failed: this tab is ahead of storage

  const show = useCallback((payload) => {
    known.current = { ...known.current, ...payload };
    baseDispatch({ type: "hydrate", payload });
  }, []);

  // Restore login state / profile edits after mount (keeps SSR output stable) and
  // follow changes made in other tabs.
  useEffect(() => {
    show(parseSession(readSession()));
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) show(parseSession(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [show]);

  // A change shows right away, then is applied to the latest saved session (another
  // tab may have saved since this one last heard) under a cross-tab lock, so edits
  // made in two tabs don't undo each other. Resolves to false when the browser won't
  // store it (the change still applies for this visit).
  const dispatch = useCallback(
    (action) => {
      const shown = reducer({ ...initialState, ...known.current }, action);
      show({ profile: shown.profile, loggedIn: shown.loggedIn });
      return withSessionLock(() => {
        const saved = unsaved.current ? {} : parseSession(readSession());
        const next = reducer({ ...initialState, ...known.current, ...saved }, action);
        show({ profile: next.profile, loggedIn: next.loggedIn });
        unsaved.current = !writeSession(next.profile, next.loggedIn);
        return !unsaved.current;
      });
    },
    [show]
  );

  // Profile edits resolve to whether they were saved, so Settings can say so.
  const updateProfile = useCallback(
    (patch) => dispatch({ type: "update_user", patch }),
    [dispatch]
  );

  // `session.user` is the profile while logged in, otherwise null.
  const session = useMemo(
    () => ({
      user: state.loggedIn ? state.profile : null,
      hydrated: state.hydrated,
      updateProfile
    }),
    [state.loggedIn, state.profile, state.hydrated, updateProfile]
  );
  const value = useMemo(() => [session, dispatch], [session, dispatch]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSessionContext() {
  return useContext(Context);
}
