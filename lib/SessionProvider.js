import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";
import { useRouter } from "next/router";

// The logged-in member, from the server session (an HttpOnly cookie). Visitors are
// guests until they log in or sign up.
//
//   const [session] = useSessionContext();
//   session.user       { id, name, username, email, avatar, role, credits, points,
//                        isDemo, location, bio, avatarUrl } or null for guests
//   session.hydrated   true once the first GET /api/me has answered
//   session.login(login, password) / signup(fields) / logout() / refresh()
//   session.updateProfile(patch) / changePassword(current, next)
//     -> resolve to { ok, error?, user? }

const SYNC_KEY = "pm-account-sync"; // tells other tabs to reload the account
const REFRESH_AFTER = 60 * 1000; // re-check a tab that comes back after a minute

// JSON requests to the site's API. Resolves to { ok, status, error?, ...data };
// never throws (a network failure is { ok: false, status: 0, error }).
export async function requestJson(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: method === "GET" ? undefined : { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {})
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Couldn't reach the server. Check your connection and try again."
    };
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body
  }
  if (!response.ok) {
    return {
      ...data,
      ok: false,
      status: response.status,
      error: data.error || "Something went wrong. Please try again."
    };
  }
  return { ...data, ok: true, status: response.status };
}

// Where to send a guest who needs an account, returning to `path` afterwards.
export function loginHref(path, page = "/login") {
  const next = safeNext(path, "");
  return next ? `${page}?next=${encodeURIComponent(next)}` : page;
}

const SAME_SITE = "https://x.invalid";

// A same-site path to continue to after logging in (never another site, never the
// login pages themselves). Browsers drop tabs/newlines and read "\" as "/" in URLs,
// so "/\t/evil.example" would leave the site: those are refused, and what's left is
// parsed as a URL that must stay on this origin.
export function safeNext(value, fallback = "/profile") {
  const next = Array.isArray(value) ? value[0] : value;
  if (typeof next !== "string" || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) {
    return fallback;
  }
  let url;
  try {
    url = new URL(next, SAME_SITE);
  } catch {
    return fallback;
  }
  if (url.origin !== SAME_SITE) return fallback;
  if (/^\/(login|signup)(?:\/|$)/i.test(url.pathname)) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

// A square placeholder with the member's initials, for accounts without a photo.
export function initialsAvatar(name) {
  const initials =
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => (word.match(/[\p{L}\p{N}]/u) || [""])[0])
      .join("")
      .toUpperCase() || "?";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" fill="#ea053f"/>` +
    `<text x="48" y="61" fill="#fff" font-family="Montserrat, Arial, sans-serif" ` +
    `font-size="34" font-weight="700" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// The API's public user as components read it.
function toSessionUser(user) {
  if (!user) return null;
  return {
    ...user,
    role: "Member",
    avatarUrl: user.avatar || null,
    avatar: user.avatar || initialsAvatar(user.name)
  };
}

function tellOtherTabs(type) {
  try {
    window.localStorage.setItem(SYNC_KEY, JSON.stringify({ type, at: Date.now() }));
  } catch {
    // storage blocked: other tabs catch up when they're next focused
  }
}

// Calls `handler(type)` when another tab changed the account ("session" for logins,
// logouts and profile edits, "orders" after a checkout).
export function useAccountSync(handler) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== SYNC_KEY || !e.newValue) return;
      try {
        latest.current(JSON.parse(e.newValue).type);
      } catch {
        latest.current("session");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

const Context = createContext();

function reducer(state, action) {
  switch (action.type) {
    case "user":
      return { user: toSessionUser(action.user), hydrated: true };
    // A balance from a checkout: only while that member is still the one logged in.
    case "account":
      return state.user && state.user.id === action.user?.id
        ? { user: toSessionUser(action.user), hydrated: true }
        : state;
    case "hydrated":
      return state.hydrated ? state : { ...state, hydrated: true };
    default:
      throw new Error(`Unknown session action: ${action.type}`);
  }
}

export function SessionProvider({ children }) {
  const router = useRouter();
  const [state, dispatchState] = useReducer(reducer, { user: null, hydrated: false });
  // Bumped by logins / logouts (here or in another tab) so answers to requests made
  // before them can't bring the old account back.
  const generation = useRef(0);
  const refreshRequest = useRef(0); // only the latest GET /api/me counts
  const lastLoaded = useRef(0);
  // Who is logged in as of the latest change (state catches up on the next render).
  const latestUserId = useRef(null);

  const setUser = useCallback((user) => {
    latestUserId.current = user?.id ?? null;
    dispatchState({ type: "user", user });
  }, []);
  const currentUserId = useCallback(() => latestUserId.current, []);

  const refresh = useCallback(async () => {
    const started = generation.current;
    const request = ++refreshRequest.current;
    lastLoaded.current = Date.now();
    const result = await requestJson("/api/me");
    if (started !== generation.current || request !== refreshRequest.current) return result;
    if (result.ok) setUser(result.user);
    else dispatchState({ type: "hydrated" }); // offline: stay a guest for now
    return result;
  }, [setUser]);

  // A login, sign-up or logout: shown right away, in every tab.
  const applyAccount = useCallback(
    (user) => {
      generation.current += 1;
      setUser(user);
      tellOtherTabs("session");
    },
    [setUser]
  );

  useEffect(() => {
    // Loaded after mount, so the first render matches the static HTML (guest).
    refresh();
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastLoaded.current > REFRESH_AFTER
      ) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  // Another tab logged in / out or checked out: whatever this tab was loading is stale.
  useAccountSync(() => {
    generation.current += 1;
    refresh();
  });

  const login = useCallback(
    async (loginName, password) => {
      const result = await requestJson("/api/auth/login", {
        method: "POST",
        body: { login: loginName, password }
      });
      if (result.ok) applyAccount(result.user);
      return { ...result, user: toSessionUser(result.user) };
    },
    [applyAccount]
  );

  const signup = useCallback(
    async (fields) => {
      const result = await requestJson("/api/auth/signup", { method: "POST", body: fields });
      if (result.ok) applyAccount(result.user);
      return { ...result, user: toSessionUser(result.user) };
    },
    [applyAccount]
  );

  const logout = useCallback(async () => {
    const result = await requestJson("/api/auth/logout", { method: "POST" });
    if (result.ok) applyAccount(null);
    return result;
  }, [applyAccount]);

  const updateProfile = useCallback(
    async (patch) => {
      const result = await requestJson("/api/me", { method: "PATCH", body: patch });
      if (result.ok) {
        setUser(result.user);
        tellOtherTabs("session");
      } else if (result.status === 401) {
        refresh();
      }
      return { ...result, user: toSessionUser(result.user) };
    },
    [setUser, refresh]
  );

  const changePassword = useCallback(
    async (current, next) => {
      const result = await requestJson("/api/me/password", {
        method: "POST",
        body: { current, next }
      });
      // Every session was signed out (this one was replaced): other tabs reload, and a
      // change that lost to one made elsewhere leaves this browser logged out.
      if (result.ok) tellOtherTabs("session");
      else if (result.status === 401 || result.status === 409) refresh();
      return result;
    },
    [refresh]
  );

  // The balance after a checkout, ignored when another account is logged in by now.
  const setAccount = useCallback((user) => {
    if (latestUserId.current !== user?.id) return false;
    dispatchState({ type: "account", user });
    tellOtherTabs("orders");
    return true;
  }, []);

  // For components written against the old demo session: "unset_user" logs out and
  // "set_user" (log in) goes to the login page.
  const dispatch = useCallback(
    (action) => {
      if (action?.type === "unset_user") return logout().then((r) => r.ok);
      if (action?.type === "set_user") {
        router.push(loginHref(router.asPath));
        return Promise.resolve(false);
      }
      if (action?.type === "update_user") return updateProfile(action.patch).then((r) => r.ok);
      return Promise.resolve(false);
    },
    [logout, router, updateProfile]
  );

  const session = useMemo(
    () => ({
      user: state.user,
      hydrated: state.hydrated,
      login,
      signup,
      logout,
      refresh,
      updateProfile,
      changePassword,
      setAccount,
      currentUserId
    }),
    [
      state,
      login,
      signup,
      logout,
      refresh,
      updateProfile,
      changePassword,
      setAccount,
      currentUserId
    ]
  );
  const value = useMemo(() => [session, dispatch], [session, dispatch]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSessionContext() {
  return useContext(Context);
}

export function useSession() {
  return useContext(Context)[0];
}
