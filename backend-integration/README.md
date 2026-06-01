# Backend Integration — Laravel ESS ↔ React Self-Service Portal

This folder contains the **Laravel-side changes** that need to be applied to the
existing ESS app (`/Users/abhishekbehera/ess` locally, `C:\inetpub\wwwroot\ess`
on UAT). The React SPA in `self-service-portal/` calls these JSON endpoints —
no business logic is duplicated, every method delegates to the existing Staff
controllers so the Business Central / NTLM SOAP integration stays in one place.

## Files to copy into the Laravel app

| Source (this folder)                                             | Destination in Laravel app                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `laravel/app/Http/Controllers/Api/AuthApiController.php`         | `app/Http/Controllers/Api/AuthApiController.php`                  |
| `laravel/app/Http/Controllers/Api/StaffApiController.php`        | `app/Http/Controllers/Api/StaffApiController.php`                 |
| `laravel/app/Http/Middleware/EssApiAuth.php`                     | `app/Http/Middleware/EssApiAuth.php`                              |
| `laravel/routes/api.php`                                         | merge into existing `routes/api.php`                              |
| `laravel/config/cors.php`                                        | replace existing `config/cors.php`                                |

## One-time wiring inside the Laravel app

1. Register the middleware alias in `app/Http/Kernel.php` under `$routeMiddleware`:

   ```php
   protected $routeMiddleware = [
       // ... existing ...
       'ess.api.auth' => \App\Http\Middleware\EssApiAuth::class,
   ];
   ```

2. Make sure `\Illuminate\Session\Middleware\StartSession::class` and
   `\App\Http\Middleware\VerifyCsrfToken::class` (or its replacement) are
   present in the `web` middleware group (they already are by default).

3. In `app/Http/Middleware/VerifyCsrfToken.php`, you can leave CSRF on. The
   React app fetches the token via `GET /api/csrf-token` and forwards it on
   each mutating request as the `X-CSRF-TOKEN` header (handled by axios in
   `src/api/essClient.ts`).

4. Run the standard publish step if `fruitcake/laravel-cors` is missing:

   ```bash
   composer require fruitcake/laravel-cors:^3.0
   ```

   Older Laravel versions ship with CORS in the framework itself; in that
   case skip this step.

5. Clear caches once after dropping the files in:

   ```bash
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   ```

## Endpoints exposed

All endpoints live under `/api`. Auth is session-based.

### Public

| Method | Path                     | Description                                |
| ------ | ------------------------ | ------------------------------------------ |
| GET    | `/api/csrf-token`        | Returns `{ token }` for CSRF protection    |
| POST   | `/api/login`             | `{ staffNo, password }` → `{ user }`       |

### Authenticated (`ess.api.auth` middleware)

| Method | Path                                                      | Returns                                  |
| ------ | --------------------------------------------------------- | ---------------------------------------- |
| POST   | `/api/logout`                                             | `{ message }`                            |
| GET    | `/api/me`                                                 | `{ user }`                               |
| GET    | `/api/staff/dashboard/statistics`                         | dashboard stats payload                  |
| GET    | `/api/staff/approvals?status=Open\|Approved\|Rejected`    | `{ rows, status }`                       |
| GET    | `/api/staff/approvals/count/{type}/{status}`              | `{ totalAll, isNotified }`               |
| GET    | `/api/staff/approvals/{docNo}`                            | document + approval entries              |
| POST   | `/api/staff/approvals/decide`                             | approve / reject document                |
| GET    | `/api/staff/leave`                                        | `{ rows }` — current year leave list     |
| GET    | `/api/staff/leave/types`                                  | `{ rows }` — leave type catalog          |
| GET    | `/api/staff/leave/relievers`                              | `{ rows }` — active employees            |
| GET    | `/api/staff/leave/balance/{type}`                         | `{ balance, pendingCount, isHourly }`    |
| GET    | `/api/staff/leave/dates/{type}/{days}/{startDate}/{half}` | `{ endDate, returnDate, isWeekend }`     |
| GET    | `/api/staff/leave/{no}`                                   | leave header + lines                     |
| POST   | `/api/staff/leave`                                        | create / update leave                    |
| POST   | `/api/staff/leave/cancel`                                 | cancel leave                             |
| GET    | `/api/staff/items`                                        | `{ rows }`                               |
| GET    | `/api/staff/items/store/{store}`                          | `{ rows }`                               |
| GET    | `/api/staff/services`                                     | `{ rows }`                               |
| GET    | `/api/staff/assets`                                       | `{ rows }`                               |
| GET    | `/api/staff/items/{item}/balance/{store}`                 | `{ balance }`                            |
| GET    | `/api/staff/payroll/years`                                | `{ rows }`                               |
| GET    | `/api/staff/payroll/years/{year}/months`                  | `{ rows }`                               |

## Pending (not yet wrapped — easy to add by following the same pattern)

- Imprest (`/api/staff/finance/imprest`)
- Imprest Surrender
- Staff Claims
- Petty Cash
- Inter-Bank Transfer (Petty Cash Replenishment)
- Store / Purchase / Transport / Fuel Requisitions
- Transfer Orders
- Work Tickets
- HOD: Department Staff & Staff on Leave
- CEO: Master Roll
- HR Document Downloads
- Profile / Change Password
- Attendance check-in/out
- Payslip / P9 PDF generation
- Training Requests
- Salary Advance
- Exit Interview

## React-side configuration

Add the following to `self-service-portal/.env.local`:

```bash
# Disable mock data — call the real Laravel API
VITE_USE_MOCK=false
# Base URL of the Laravel ESS app
VITE_ESS_API_URL=http://192.168.224.37:81
```

That's the only change needed on the front end — the API client in
`src/api/essClient.ts` reads these vars automatically.

## Smoke test

After deploying, exercise these in order:

```bash
# 1. CSRF token (sets XSRF-TOKEN cookie)
curl -i -c cookies.txt http://192.168.224.37:81/api/csrf-token

# 2. Login (uses cookie + token)
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"staffNo":"HB-02418","password":"YOUR_PASSWORD"}' \
  http://192.168.224.37:81/api/login

# 3. Hit any authenticated endpoint
curl -i -b cookies.txt http://192.168.224.37:81/api/staff/dashboard/statistics
```

If all three return 200, the React app will work end-to-end.
