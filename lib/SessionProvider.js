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

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    if (state.hydrated) writeSession(state.profile, state.loggedIn);
  }, [state.hydrated, state.profile, state.loggedIn]);

  // Profile edits are saved right away so the caller can tell the user whether
  // they'll survive a reload (they still apply for this visit either way).
  const updateProfile = useCallback((patch) => {
    const current = stateRef.current;
    dispatch({ type: "update_user", patch });
    if (!current.hydrated) return true; // saved by the effect once restored
    return writeSession({ ...current.profile, ...patch }, current.loggedIn);
  }, []);

  // `session.user` is the profile while logged in, otherwise null.
  const session = useMemo(
    () => ({
      user: state.loggedIn ? state.profile : null,
      hydrated: state.hydrated,
      updateProfile
    }),
    [state.loggedIn, state.profile, state.hydrated, updateProfile]
  );
  const value = useMemo(() => [session, dispatch], [session]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSessionContext() {
  return useContext(Context);
}
