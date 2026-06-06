# Self-Service Portal — Integration Audit

**Date:** 6 June 2026  
**Scope:** Frontend (`self-service-portal`), Backend (`server`), Database (`db`)  
**Purpose:** Record what was built, how the three layers connect, what was fixed, and what remains.

---

## 1. Executive summary

The portal was refactored from a **mock-driven demo** into a **backend-first** application:

| Layer | Status |
|-------|--------|
| **Database** | 7 Prisma models, migration, seed users + sample requests |
| **Backend** | 37 API routes, JWT auth, role guards on approvals/HOD/CEO/reports |
| **Frontend** | All screens call `VITE_AUTH_API_URL`; mock/hardcoded list data removed |
| **Role-based UI** | Navigation, routes, dashboard, and approvals gated by roles |
| **Local dev** | Frontend → `localhost:4000` → MySQL via Prisma |

**Not production-complete until:** server + `DATABASE_URL` deployed on Vercel, frontend `VITE_AUTH_API_URL` set and redeployed.

---

## 2. Architecture

```
┌─────────────────────┐     JWT Bearer      ┌─────────────────────┐     Prisma     ┌──────────────┐
│  React (Vite)       │ ──────────────────► │  Node/Express       │ ─────────────► │  MySQL       │
│  self-service-portal│   /api/auth/*       │  server/            │                │  ssp_portal  │
│                     │   /api/*            │  port 4000          │                │              │
└─────────────────────┘                     └─────────────────────┘                └──────────────┘
```

- **Auth:** Stateless JWT (`Authorization: Bearer <token>`), stored in `localStorage` as `ssp.authToken`.
- **Data contract:** Backend returns normalized shapes; frontend maps auth user → `Employee` with `roles[]`.
- **No mock fallback:** If `VITE_AUTH_API_URL` is unset, API calls throw before HTTP — no fake rows.

---

## 3. Database (`db/`)

### 3.1 Schema (7 tables)

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Login, roles, HOD/CEO flags, leave balance |
| `PortalRequest` | `portal_requests` | All self-service requests (18 module types) |
| `AttendanceRecord` | `attendance_records` | Sign-in / sign-out |
| `PayrollSlip` | `payroll_slips` | Payslip + master roll |
| `PolicyDocument` | `policy_documents` | HR downloads |
| `PerformanceReview` | `performance_reviews` | Performance screen |
| `EmployeeProfile` | `employee_profiles` | Profile page details |

**Migration:** `db/prisma/migrations/20260606000000_init_auth_requests_attendance/migration.sql`

### 3.2 Repositories (28 exports)

All accessed via `@ssp/db` from the server:

- `userRepository` — find, list, upsert, updatePassword
- `requestRepository` — CRUD requests, approvals queue, `dashboardSummary`
- `attendanceRepository`, `payrollRepository`, `documentRepository`, `performanceRepository`, `profileRepository`

### 3.3 Seed data (`db/prisma/seed.js`)

**Users (canonical seed — use this, not server-only seed):**

| Staff No | Password | Roles |
|----------|----------|-------|
| `EMP-02418` | `Password@123` | staff, hod, ictAdmin, ceo |
| `EMP-01002` | `Password@123` | staff, lineManager, hod |
| `EMP-03245` | `Password@123` | staff |
| `HB-00123` | `Secret@123` | staff |

Also seeds: payroll slips (March 2026), performance reviews, employee profiles, 5 policy documents.

**Sample requests (5 rows)** for demo dashboards/approvals/reports:

- `IMP-SEED-0001` — imprest, Pending
- `LV-SEED-0001` — leave, Approved
- `SR-SEED-0001` — store requisition (with lines), Approved
- `GP-SEED-0001` — gate pass, Approved
- `PC-SEED-0001` — petty cash, Rejected

**Run seed:**

```bash
cd db && npm run seed
```

---

## 4. Backend (`server/`)

### 4.1 Configuration

| Env | Purpose |
|-----|---------|
| `AUTH_PROVIDER=local` | Bcrypt login against DB |
| `USER_STORE=db` | Users from Prisma |
| `DATABASE_URL` | MySQL connection (match `db/.env`) |
| `JWT_SECRET` | Token signing |
| `CORS_ORIGINS` | e.g. `http://localhost:5173` |

### 4.2 API surface (37 endpoints)

**Public**

- `GET /api/health`
- `POST /api/auth/login`

**Auth (JWT)**

- `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/change-password`

**Portal (JWT, all in `routes/portal.ts`)**

| Area | Routes |
|------|--------|
| Requests | `GET/POST /api/requests`, `GET /api/requests/:id`, cancel, delete |
| Approvals | `GET /api/approvals`, `POST /api/approvals/:id/decide`, count |
| Dashboard | `GET /api/dashboard/summary` |
| Leave | types, relievers, balance, dates, list, submit, cancel |
| Attendance | list, team, sign-in, sign-out |
| HOD | team-requests, staff-on-leave |
| Payroll | payslip, master-roll |
| Performance, Profile, Documents, Work tickets | read endpoints |
| Reports | store-usage, leave-balance, gate-pass-log |
| Items | `GET /api/items` (static catalog on server) |

### 4.3 Role guards (backend)

| Endpoint group | Who can access |
|----------------|----------------|
| `/api/approvals/*` | lineManager, hod, finance, ceo (+ HOD/CEO flags) |
| `/api/hod/*` | hod (+ HOD flag) |
| `/api/payroll/master-roll` | ceo (+ CEO flag) |
| `/api/reports/leave-balance` | hod, hr, ceo |
| `/api/reports/store-usage` | hod, procurement, ceo |
| `/api/reports/gate-pass-log` | hod, procurement, audit, ceo |

Implemented in `server/src/utils/roles.ts` (`userHasAnyRole`, `canUserApprove`).

### 4.4 Server seed alignment

`server/src/scripts/seed.ts` was updated to include `HB-00123` and match `db/prisma/seed.js` users. **Prefer `cd db && npm run seed`** for full data (requests, payroll, profiles).

---

## 5. Frontend (`self-service-portal/`)

### 5.1 Environment (required)

```env
VITE_AUTH_API_URL=http://localhost:4000   # local
# VITE_AUTH_API_URL=https://your-server.vercel.app   # production
VITE_APP_NAME=Self Service Portal
```

- **`VITE_USE_MOCK` removed** — no mock mode.
- All endpoints use `requireAuthApiUrl()` (`src/api/requireBackend.ts`).

### 5.2 Role system

| File | Role |
|------|------|
| `src/config/roles.ts` | `PortalRole` types, `deriveRoles()`, approver roles |
| `src/config/roleAccess.ts` | Report role groups, dashboard quick links, capability text |
| `src/hooks/usePermissions.ts` | Central `has()`, `canApprove`, report permissions |
| `src/hooks/useNavigation.ts` | Filters sidebar by role |
| `src/components/shared/RoleRoute.tsx` | Route guard + friendly 403 panel |
| `src/config/navigation.ts` | Per-item `roles` on Approvals, CEO, HOD, reports, ERP connector |

### 5.3 What each role sees

| Role | Extra beyond staff self-service |
|------|----------------------------------|
| **staff** | Submit requests, payslip, profile, documents |
| **lineManager / finance** | Approvals menu + actions |
| **hod** | HOD function, team attendance, leave balance report |
| **ceo** | Master roll, all reports, ERP connector |
| **hr** | Leave balance report |
| **procurement** | Store usage + gate pass reports |
| **audit** | Gate pass report |
| **ictAdmin** | ERP connector |

### 5.4 Backend integration by screen

| Category | Screens | API |
|----------|---------|-----|
| Auth | Login, Change Password, Profile | `/api/auth/*`, `/api/profile/details` |
| Dashboard | Dashboard | `/api/dashboard/summary` |
| HR | Leave, Leave Statement, Attendance, Performance, Payslip, Training, etc. | `/api/leave/*`, `/api/attendance/*`, `/api/performance`, `/api/payroll/payslip`, `/api/requests` |
| Finance | Imprest, Surrender, Staff Claim, Petty Cash | `/api/requests?module=...` |
| Facility | Store, Purchase, Transport, Fuel, Gate Pass, etc. | `/api/requests`, `/api/work-tickets` |
| Approvals | Pending / Approved / Rejected / Detail | `/api/approvals`, `/api/requests/:id` |
| HOD | Team requests, Staff on leave | `/api/hod/*` |
| CEO | Master roll | `/api/payroll/master-roll` |
| Reports | Leave balance, Store usage, Gate pass | `/api/reports/*` |
| Downloads | Documents | `/api/documents` |

**18 request modules** map 1:1 to `portal_requests.requestType` (see `db/src/requestRepository.js` `modulePrefixes`).

### 5.5 Mock / hardcoded data — removed

| Before | After |
|--------|-------|
| `mockStore.ts` drove lists when `USE_MOCK=true` | Not wired; lists empty/error without backend |
| Auto-login as demo employee | Real login only |
| Staff Claim row `SC-2026-00027` etc. | Only from DB if seeded/created |
| Dashboard zeros on API failure | Error banner + expected URL shown |
| Profile `defaultProfileDetails` fallback | Loading/error states |
| Attendance local fake rows | API only |
| Leave statement fake rows | API only |

`mockStore.ts` file remains in repo but is **not used** by production UI paths.

### 5.6 Dashboard fix (latest)

`Dashboard.tsx` now:

- Waits for `bootstrapped && isAuthenticated && getToken()` before calling API
- Shows error if backend down or `VITE_AUTH_API_URL` missing
- Does not mask failures with zero tiles

---

## 6. Sync audit results

### 6.1 Fully in sync

- Frontend API paths ↔ backend routes (32 portal paths + 5 auth)
- Portal module keys (18) ↔ `modulePrefixes` in DB
- JWT auth ↔ `users` table
- Core role guards ↔ frontend `RoleRoute` + navigation
- Typecheck passes on frontend and server

### 6.2 Partially integrated (reference data)

These use the **API for transactions** but **static dropdowns** remain:

| Item | Location | Notes |
|------|----------|-------|
| Departments | `src/data/departments.ts` | Form dropdowns |
| Hospital coverage | `src/data/hospitalCoverage.ts` | Staff claim form |
| Leave type filter | `src/data/leaveTypes.ts` | Leave statement filter only |
| Store item codes | `src/data/items.ts` | Store requisition — **not** using `/api/items` |
| Leave types / items API | `server/src/routes/portal.ts` | Served by API but **hardcoded on server**, not DB |

### 6.3 Known bugs / gaps

| Issue | Severity |
|-------|----------|
| **Imprest Surrender** list uses `listImprestRequests` (wrong module) | Medium — create works, list wrong |
| **Vercel production** needs server deploy + `DATABASE_URL` + frontend env redeploy | High for prod |
| **`dashboardSummary.leaveBalance`** hardcoded `0` in db repo (server overlays from user) | Low |
| No seeded `hr` / `procurement` / `audit` / `finance`-only demo users | Low — test via DB role edit |

---

## 7. Local development checklist

```bash
# 1. Database
cd db && npm run seed          # users + sample data
cd db && npm run studio        # optional: http://localhost:5555

# 2. Backend
cd server && npm run dev       # http://localhost:4000

# 3. Frontend
cd self-service-portal && npm run dev   # http://localhost:5173
```

**Verify in browser (Network tab):**

1. `POST /api/auth/login`
2. `GET /api/auth/me`
3. `GET /api/dashboard/summary`
4. `GET /api/requests?module=staffClaim`

---

## 8. Vercel deployment checklist

### Frontend project

```
VITE_AUTH_API_URL=https://<your-server>.vercel.app
```

Remove `VITE_USE_MOCK` if present. **Redeploy** after env change.

### Server project

```
AUTH_PROVIDER=local
USER_STORE=db
DATABASE_URL=<cloud-mysql-url>
JWT_SECRET=<long-random-string>
CORS_ORIGINS=https://<your-frontend>.vercel.app
```

Deploy full `server/` (not auth-only subset). Run `db` migrations against cloud MySQL and seed.

---

## 9. Key files reference

| Purpose | Path |
|---------|------|
| Prisma schema | `db/prisma/schema.prisma` |
| DB seed | `db/prisma/seed.js` |
| Portal API | `server/src/routes/portal.ts` |
| Auth API | `server/src/routes/auth.ts` |
| Backend roles | `server/src/utils/roles.ts` |
| Frontend env | `self-service-portal/src/config/env.ts` |
| Backend guard helper | `self-service-portal/src/api/requireBackend.ts` |
| Frontend roles | `self-service-portal/src/config/roles.ts` |
| Role access / reports | `self-service-portal/src/config/roleAccess.ts` |
| Navigation | `self-service-portal/src/config/navigation.ts` |
| Permissions hook | `self-service-portal/src/hooks/usePermissions.ts` |
| Dashboard | `self-service-portal/src/pages/dashboard/Dashboard.tsx` |

---

## 10. Changelog (session work)

1. **Role-based frontend** — navigation, routes, dashboard, approvals UI per role  
2. **Backend portal API** — requests, leave, attendance, payroll, HOD, reports, dashboard  
3. **DB schema + seed** — 4 users, profiles, payroll, documents, 5 sample requests  
4. **Local integration** — `VITE_AUTH_API_URL=http://localhost:4000`, mock disabled  
5. **Sync fixes** — report API role guards; aligned server/db seeds; ERP connector in nav  
6. **Removed mock/hardcoded data** — all list/auth flows require backend  
7. **Dashboard** — waits for auth token; shows errors instead of fake zeros  
8. **Audit** — documented gaps (static dropdowns, Imprest Surrender list bug, Vercel deploy)

---



*End of audit document.*
