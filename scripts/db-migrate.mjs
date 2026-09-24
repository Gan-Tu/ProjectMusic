// Applies db/schema.sql (idempotent). Usage: npm run db:migrate
// Reads DATABASE_URL from the environment or .env.local (`vercel env pull .env.local`).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  const file = path.join(root, ".env.local");
  if (process.env.DATABASE_URL || !existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const schema = readFileSync(path.join(root, "db/schema.sql"), "utf8");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(schema);
    const { rows } = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' order by 1"
    );
    console.log(`Schema applied. Tables: ${rows.map((r) => r.table_name).join(", ")}`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
