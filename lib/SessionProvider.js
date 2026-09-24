import { createContext, useContext, useEffect, useReducer } from "react";

// Single-user demo: "logging in" just restores this profile.
export const DEFAULT_USER = {
  name: "Nick Breton",
  username: "Propeller",
  email: "info@truthstudios.com",
  role: "Administrator",
  avatar: "https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg"
};

const STORAGE_KEY = "pm-session-v1";

const Context = createContext();

const initialState = {
  user: DEFAULT_USER,
  hydrated: false
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "set_user":
      return { ...state, user: { ...DEFAULT_USER, ...action.user } };
    case "update_user":
      return { ...state, user: state.user && { ...state.user, ...action.patch } };
    case "unset_user":
      return { ...state, user: null };
    default:
      throw new Error(`Unknown session action: ${action.type}`);
  }
}

function parseSession(raw) {
  try {
    const saved = JSON.parse(raw || "null");
    if (saved && "user" in saved) {
      return { user: saved.user && { ...DEFAULT_USER, ...saved.user } };
    }
  } catch {
    // ignore corrupt storage
  }
  return {};
}

export function SessionProvider({ children }) {
  const [session, dispatch] = useReducer(reducer, initialState);

  // Restore login state / profile edits after mount (keeps SSR output stable) and
  // follow logins/logouts made in other tabs.
  useEffect(() => {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    dispatch({ type: "hydrate", payload: parseSession(raw) });
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) dispatch({ type: "hydrate", payload: parseSession(e.newValue) });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist only once the restored session has been applied.
  useEffect(() => {
    if (!session.hydrated) return;
    try {
      const json = JSON.stringify({ user: session.user });
      if (window.localStorage.getItem(STORAGE_KEY) !== json) {
        window.localStorage.setItem(STORAGE_KEY, json);
      }
    } catch {
      // storage unavailable
    }
  }, [session.hydrated, session.user]);

  return <Context.Provider value={[session, dispatch]}>{children}</Context.Provider>;
}

export function useSessionContext() {
  return useContext(Context);
}
