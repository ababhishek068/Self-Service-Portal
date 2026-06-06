# Self-Service Portal — Backend (Auth API)

Node.js + Express + JWT backend that provides **login for the React Self-Service
Portal**. It is designed around a pluggable auth provider so there are two
login strategies:

| Provider | `AUTH_PROVIDER` | Status | What it does |
|----------|-----------------|--------|--------------|
| **Local** (our backend) | `local` | ✅ Works now | Verifies staff no + password against our own user store (bcrypt hashes) |
| **Business Central** | `bc` | 🚧 Stub (later) | Will verify against BC web services — see `src/auth/bcProvider.ts` |

Switching strategy is a single env var. The React app never changes — both
providers return the same `AuthUser` contract.

---

## Quick start (development)

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run seed                # create demo users
npm run dev                 # starts http://localhost:4000
```

Demo accounts (all use password `Password@123`):

| Staff No | Name | Roles |
|----------|------|-------|
| `EMP-02418` | Admin User | staff + HOD + ICT Admin + CEO |
| `EMP-01002` | Manager User | staff + Line Manager + HOD |
| `EMP-03245` | Staff User | staff |
| `HB-00123` | Abhishek Behera | staff (`Secret@123` when seeded via `db/prisma/seed.js`) |

After changing backend routes or the database schema, redeploy the `server/` app
so production (e.g. Vercel) exposes the full `/api/*` portal surface — not just
`/api/auth/*`.

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/api/health` | — | Liveness + active provider |
| POST | `/api/auth/login` | — | `{ staffNo, password }` → `{ token, user }` |
| GET  | `/api/auth/me` | Bearer | Current user from token |
| POST | `/api/auth/logout` | Bearer | Symbolic (JWT is stateless) |
| POST | `/api/auth/change-password` | Bearer | `{ currentPassword, newPassword }` |
| GET/POST | `/api/requests` | Bearer | List/create all portal request modules |
| POST/DELETE | `/api/requests/:id/*` | Bearer | Cancel/delete request drafts and pending requests |
| GET/POST | `/api/approvals` | Bearer | Approval queue and approve/reject actions |
| GET | `/api/dashboard/summary` | Bearer | Dashboard tiles and recent activity |
| GET/POST | `/api/leave/*` | Bearer | Leave catalog, balances, dates, list, submit, cancel |
| GET/POST | `/api/attendance/*` | Bearer | Attendance list, team attendance, sign-in, sign-out |
| GET | `/api/reports/*` | Bearer | Store usage, leave balance, gate pass reports |

Auth is a **JWT bearer token**: the client stores the token from `/login` and
sends `Authorization: Bearer <token>` on subsequent requests.

---

## Configuration (`.env`)

See `.env.example` for the full list. Key values:

- `AUTH_PROVIDER` — `local` (now) or `bc` (later)
- `JWT_SECRET` — **must** be a long random string in production
- `CORS_ORIGINS` — comma-separated list of the React app's URL(s)
- `USER_STORE` — `db` for MySQL/Prisma, or `json` for a local file fallback
- `DATABASE_URL` — required when `USER_STORE=db`
- `USER_STORE_PATH` — where the JSON user store lives

Generate a production secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Production

```bash
npm install
npm run build      # compiles TypeScript to dist/
npm start          # node dist/index.js
```

Run it as a Windows service (e.g. with `nssm` or `pm2`) so it restarts on
reboot. Point the React app at it via `VITE_AUTH_API_URL`.

### Where users are stored

The local provider uses `USER_STORE=db` with MySQL/Prisma when `DATABASE_URL`
is configured. A JSON file fallback (`data/users.json`) is still available for
offline demos by setting `USER_STORE=json`. Both stores hold only **bcrypt
password hashes** — never plaintext.

Request screens are stored in the MySQL `portal_requests` table. Attendance is
stored in `attendance_records`. The backend exposes a generic request API so new
frontend modules can persist without adding a new table for every form.

---

## Adding the Business Central provider (way #1) later

Implement `authenticate()` in `src/auth/bcProvider.ts`. A reference PHP
implementation already exists in
`../backend-integration/laravel/app/Http/Controllers/Api/AuthApiController.php`.
Then set `AUTH_PROVIDER=bc` and fill in the `BC_*` env vars. No frontend change
is required.
