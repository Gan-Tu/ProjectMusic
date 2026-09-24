import { useEffect, useState } from "react";
import Router from "next/router";

// Client helpers for the CRM API. Mutations always send JSON (the API requires it).
export async function crmFetch(url, { method = "GET", body } = {}) {
  const init = { method, credentials: "same-origin", headers: { Accept: "application/json" } };
  if (method !== "GET") {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body ?? {});
  }
  const res = await fetch(url, init);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (res.status === 401 && url !== "/api/crm/login" && typeof window !== "undefined") {
    const next = `${window.location.pathname}${window.location.search}`;
    Router.replace(`/crm/login?next=${encodeURIComponent(next)}`);
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data;
}

// Asks the sidebar to reload its counts (e.g. after an inbox message changed).
export function notifyBadges() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("crm:badges"));
}

export function entityApi(entity, id) {
  const base = `/api/crm/entities/${entity}`;
  return id === undefined ? base : `${base}/${encodeURIComponent(id)}`;
}

export function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

// Option lists for selects ({ value, label, image, status }), cached per page load.
const optionCache = new Map();

export function loadOptions(types) {
  const missing = types.filter((type) => !optionCache.has(type));
  if (missing.length) {
    const request = crmFetch(`/api/crm/options?types=${missing.join(",")}`);
    request.catch(() => missing.forEach((type) => optionCache.delete(type)));
    missing.forEach((type) =>
      optionCache.set(
        type,
        request.then((data) => data[type] || [])
      )
    );
  }
  return Promise.all(types.map((type) => optionCache.get(type))).then((lists) =>
    Object.fromEntries(types.map((type, index) => [type, lists[index]]))
  );
}

export function invalidateOptions(type) {
  optionCache.delete(type);
}

export function useOptions(types) {
  const key = types.filter(Boolean).join(",");
  const [state, setState] = useState({ key: "", options: {} });
  useEffect(() => {
    let alive = true;
    if (!key) return undefined;
    loadOptions(key.split(","))
      .then((options) => alive && setState({ key, options }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return state.options;
}

// Loads JSON from `url` (null = don't load). Returns { data, error, loading, reload, setData }.
export function useCrmData(url) {
  const [state, setState] = useState({ url: null, data: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    crmFetch(url)
      .then((data) => alive && setState({ url, data, error: null }))
      .catch((error) => alive && setState((prev) => ({ ...prev, url, error: error.message })));
    return () => {
      alive = false;
    };
  }, [url, version]);
  return {
    data: state.data,
    error: state.error,
    loading: Boolean(url) && state.url !== url,
    reload: () => setVersion((n) => n + 1),
    setData: (update) =>
      setState((prev) => ({
        ...prev,
        data: typeof update === "function" ? update(prev.data) : update
      }))
  };
}
