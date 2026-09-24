// Resets the database to the demo data: all content plus the demo member account
// (username "demo", password "demo1234"). Usage: npm run db:seed
// Runs under tsx so it can import the app's modules. Reads DATABASE_URL from the
// environment or .env.local, like db-migrate.mjs.
import { loadEnv } from "./db-migrate.mjs";

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const { applySeed } = await import("../lib/server/seed.js");
  const started = Date.now();
  const { scope, counts } = await applySeed({ scope: "all" });
  const width = Math.max(...Object.keys(counts).map((table) => table.length));
  console.log(`Seeded (scope "${scope}") in ${((Date.now() - started) / 1000).toFixed(1)}s:`);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(width)}  ${count}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
