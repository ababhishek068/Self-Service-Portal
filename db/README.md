# @ssp/db — Database layer (MySQL + Prisma)

This folder is **database-only**: the Prisma schema, migrations, connection
config, generated client, and seed data. It contains no HTTP/app logic. The
backend (`../server`) imports it as `@ssp/db` and never touches Prisma directly.

```
db/
├── prisma/
│   ├── schema.prisma     ← tables (users, portal_requests, attendance_records)
│   ├── migrations/       ← generated migration history
│   └── seed.js           ← demo users
├── src/
│   ├── client.js         ← PrismaClient singleton
│   ├── userRepository.js ← typed data API (find/list/upsert/updatePassword)
│   ├── index.js          ← public entry
│   └── index.d.ts        ← public TypeScript types (DbUser, …)
├── .env.example          ← DATABASE_URL
└── README.md
```

## Prerequisites

A running **MySQL** (or MariaDB) server and a database, e.g.:

```sql
CREATE DATABASE ssp_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ssp'@'%' IDENTIFIED BY 'ssp_password';
GRANT ALL PRIVILEGES ON ssp_portal.* TO 'ssp'@'%';
FLUSH PRIVILEGES;
```

## Setup

```bash
cd db
npm install                 # installs Prisma + generates the client (postinstall)
cp .env.example .env         # Windows: copy .env.example .env
#   → edit .env and set DATABASE_URL to your MySQL
#   → cloud MySQL/TiDB URLs may include required SSL query params

npm run migrate              # first time (dev): creates tables + migration files
#   in production use:  npm run migrate:deploy

npm run seed                 # insert demo users (password: Password@123)
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run generate` | Regenerate the typed Prisma client after schema edits |
| `npm run migrate` | Create & apply a dev migration |
| `npm run migrate:deploy` | Apply existing migrations (production) |
| `npm run studio` | Open Prisma Studio (visual DB browser) |
| `npm run seed` | Insert/refresh demo users |
| `npm run create-user -- …` | Create/update one real user (hashes the password) |

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Login users, role flags, employee profile data, leave balance |
| `portal_requests` | All request/form screens: finance, facility, HR, approvals, reports |
| `attendance_records` | Attendance sign-in/sign-out records |

Screen-specific form fields are stored in `portal_requests.payload`; workflow
fields such as status, maker, approver, amount, module, and dates are normal
columns for filtering and reporting.

## Creating users (the only way accounts are made)

The portal has no signup screen — accounts are created in the database. Two
options:

**1. CLI (recommended — handles password hashing for you):**

```bash
cd db
npm run create-user -- --staffNo EMP-00123 --name "Jane Doe" --password "Secret@123" --department FIN
# flags: --roles staff,lineManager,hod  --ceo  --hod  --must-change
#   --status Active|Inactive|Blocked  --phone  --gender
# optional profile flags: --email  --department-name  --branch-code  --branch-name
#   --job-title  --job-grade  --place-of-duty  --account-number  --manager
#   --leave-balance  --responsible-center  --permission-departments
```

Re-running with the same `--staffNo` updates that user (e.g. to reset a password).

**2. Prisma Studio (visual editor):**

```bash
npm run studio
```

> Avoid hand-writing `INSERT` statements: the `password_hash` column must be a
> bcrypt hash, which the CLI generates for you.

## Notes

- Passwords are stored only as **bcrypt hashes**.
- To add tables/columns, edit `prisma/schema.prisma` then run `npm run migrate`.
- The backend selects this DB store automatically when `DATABASE_URL` is set
  (otherwise it falls back to a JSON file store — see `../server`).
