import { neon, Pool } from "@neondatabase/serverless";

// Server-only database access (Neon Postgres). Never import this from client code.
//
//   sql`select * from artists where id = ${id}`   one-shot query over HTTP (fast, no
//                                                 connection to manage)
//   sql.query("select ... $1", [value])           the same with a dynamic SQL string
//   sql.transaction([sql`...`, sql`...`])         several statements in one
//                                                 non-interactive transaction
//   withTransaction(async (client) => { ... })    interactive transaction (read, decide,
//                                                 write) over a WebSocket connection;
//                                                 client.query(text, params) -> { rows }

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (run `vercel env pull .env.local`).");
  return url;
}

let httpSql;
function getSql() {
  if (!httpSql) httpSql = neon(databaseUrl());
  return httpSql;
}

// Lazily bound so importing this module (e.g. during `next build` page collection)
// never needs the environment variable.
export const sql = new Proxy(function sqlTag() {}, {
  apply: (_target, _this, args) => getSql()(...args),
  get: (_target, prop) => {
    const value = getSql()[prop];
    return typeof value === "function" ? value.bind(getSql()) : value;
  }
});

// Runs `fn(client)` inside BEGIN/COMMIT (ROLLBACK when it throws). A short-lived pool
// per call, as Neon recommends for serverless functions.
export async function withTransaction(fn) {
  const pool = new Pool({ connectionString: databaseUrl() });
  // A dropped connection surfaces as an 'error' event on the checked-out client;
  // without a listener it would crash the function instead of failing the query.
  let broken = null;
  const onError = (error) => {
    broken = error;
  };
  try {
    const client = await pool.connect();
    client.on("error", onError);
    try {
      await client.query("begin");
      const result = await fn(client);
      if (broken) throw broken;
      await client.query("commit");
      return result;
    } catch (error) {
      if (!broken) {
        try {
          await client.query("rollback");
        } catch {
          // connection already broken; the transaction is gone either way
        }
      }
      throw error;
    } finally {
      client.off("error", onError);
      client.release(broken || undefined);
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

// Runs a multi-statement SQL script (simple query protocol), e.g. db/schema.sql.
export async function runScript(text) {
  const pool = new Pool({ connectionString: databaseUrl() });
  try {
    await pool.query(text);
  } finally {
    await pool.end();
  }
}
