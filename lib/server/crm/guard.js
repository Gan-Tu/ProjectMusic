import { getSessionAdmin } from "../auth";

// getServerSideProps for CRM pages: redirects to /crm/login?next=… without an admin
// session. `load(context, admin)` may return { props } or { notFound: true }.
export function crmPage(load) {
  return async function getServerSideProps(context) {
    const admin = await getSessionAdmin(context.req);
    if (!admin) {
      const next = encodeURIComponent(context.resolvedUrl || "/crm");
      return { redirect: { destination: `/crm/login?next=${next}`, permanent: false } };
    }
    context.res.setHeader("Cache-Control", "private, no-store");
    const result = load ? await load(context, admin) : null;
    if (result?.notFound) return { notFound: true };
    return { props: { admin, ...(result?.props || {}) } };
  };
}

// Only same-site relative paths are allowed as post-login destinations.
export function safeNext(value) {
  const text = typeof value === "string" ? value : "";
  return text.startsWith("/crm") && !text.startsWith("//") && !text.includes("\\") ? text : "/crm";
}
