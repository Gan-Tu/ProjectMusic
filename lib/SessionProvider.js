import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

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
      return {
        profile: { ...DEFAULT_USER, ...saved.profile },
        loggedIn: saved.loggedIn !== false
      };
    }
  } catch {
    // ignore corrupt storage
  }
  return {};
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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
    if (!state.hydrated) return;
    try {
      const json = JSON.stringify({ profile: state.profile, loggedIn: state.loggedIn });
      if (window.localStorage.getItem(STORAGE_KEY) !== json) {
        window.localStorage.setItem(STORAGE_KEY, json);
      }
    } catch {
      // storage unavailable
    }
  }, [state.hydrated, state.profile, state.loggedIn]);

  // `session.user` is the profile while logged in, otherwise null.
  const session = useMemo(
    () => ({ user: state.loggedIn ? state.profile : null, hydrated: state.hydrated }),
    [state.loggedIn, state.profile, state.hydrated]
  );
  const value = useMemo(() => [session, dispatch], [session]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSessionContext() {
  return useContext(Context);
}
