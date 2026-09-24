# Provisioned resources, pricing and rollback

Everything created for the database / accounts / CRM work, what it costs, and how to
undo it. Provisioned on 2026-09-24.

## Summary

| Resource | Where | Plan / price | Created by this work? |
| --- | --- | --- | --- |
| Neon Postgres database `project-music-db` | Vercel Marketplace → Neon (team `tugan-team`) | **Neon Free** (`free_v3`): **$0/month** | **Yes** |
| Neon integration installation `icfg_1V9Ja0EB3D46XkiohGLtusYA` | Vercel team `tugan-team` | Free plan | No (already installed, reused) |
| 18 environment variables on Vercel project `project-music` | Production, Preview, Development | $0 | **Yes** (added automatically when the database was connected) |
| `CRM_ADMIN_USERNAME`, `CRM_ADMIN_PASSWORD` env vars | Production + Preview (password stored as sensitive), Development | $0 | **Yes** (the CRM admin login) |
| Vercel project `project-music` (Hobby) | tugan-team | existing plan, no paid add-ons | No |
| AWS | — | — | **Nothing provisioned** (not needed: media is URL-only) |

Expected monthly cost of this work: **$0** (all within free tiers).

## Neon database

- Name: `project-music-db`
- Vercel store id: `store_JeDDTXz9XSaCNZbS`
- Neon project id: `round-cake-01623706`
- Region: `iad1` (AWS us-east-1, Washington D.C.) — same region as the project's Vercel
  Functions (`iad1`), so queries stay in-region.
- Plan: **Free** (`free_v3`), no credit card: 0.5 GB storage per project, 100 CU-hours
  of compute per project per month, compute up to 2 CU / 8 GB RAM, scales to zero when
  idle. The seeded catalog is a few MB.
- Dashboard: Vercel → tugan-team → Storage → `project-music-db` (or
  `vercel integration open neon project-music-db`).
- Connected to project `project-music` (`prj_8BGl0QGNcEoC2gg36rM9J2AH3E6y`) for
  production, preview and development. **All three environments share this one
  database**, so preview deployments and local development (`vercel env pull
  .env.local`) read and write the production data.

Environment variables added to the Vercel project (values are secrets; only
`DATABASE_URL` is used by the code):

`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`,
`PGDATABASE`, `PGPASSWORD`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`,
`POSTGRES_URL_NO_SSL`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`,
`POSTGRES_DATABASE`, `POSTGRES_PRISMA_URL`, `NEON_PROJECT_ID`, `NEON_AUTH_BASE_URL`,
`VITE_NEON_AUTH_URL`

### What happens at the free-plan limits

If the 100 CU-hours or 0.5 GB were ever exceeded, Neon suspends the compute until the
next month instead of billing — the site would show errors for database-backed pages.
Upgrading is a plan change in the Neon dashboard (Launch plan: $0.106 per CU-hour and
$0.35 per GB-month, billed through Vercel). ISR caching (pages regenerate at most once a
minute, or on CRM edits) keeps database load low.

## Vercel usage

No new Vercel products. The new API routes (auth, checkout, comments, CRM) run as
Vercel Functions and the public pages use ISR; both count toward the Hobby plan's
included usage (see Vercel → Usage).

## Credentials

- CRM admin: the email and password in the `CRM_ADMIN_USERNAME` / `CRM_ADMIN_PASSWORD`
  env vars on Vercel (they are not in the repository, which is public). Without both
  variables CRM login is disabled. To change them:
  `printf '%s' '<new value>' | vercel env add CRM_ADMIN_PASSWORD production --sensitive --force`
  (repeat for `preview` and `development`), redeploy, and sign in again — existing CRM
  sessions stay valid until they expire (3 days) unless you clear them
  (`delete from sessions where kind = 'admin'`).
- Demo member account (seeded): username `demo`, password `demo1234`.

## Rollback

1. **Code**: revert the CRM/database commits on `main` and push (`git revert <sha>…`)
   — the site returns to the static demo data. The static generators in `utils/` are
   still in the repo (they are the seed source).
2. **Disconnect** the database from the project (keeps the data, removes the env
   vars): `vercel integration resource disconnect project-music-db project-music`
3. **Delete** the database and all its data (irreversible):
   `vercel integration resource remove project-music-db` (or Vercel → Storage →
   `project-music-db` → Settings → Delete).
4. The Neon integration installation itself predates this work; leave it installed.

## Operations

- Apply the schema (idempotent): `npm run db:migrate`
- Reset all data to the demo (members, orders and content): `npm run db:seed`, or CRM →
  Settings → Reset to demo data (choose content only, or everything).
- Local setup: `vercel env pull .env.local` then `npm run dev`.
