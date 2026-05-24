# Self Service Portal

Production-ready Employee Self Service Portal scaffold for a Microsoft Dynamics 365 Business Central ERP environment, built with React 18, Vite, TypeScript, TailwindCSS, TanStack Query v5, React Router v6, Axios, React Hook Form, Zod, shadcn-style UI components, Lucide icons, and date-fns.

## Setup

```bash
cd <project-directory>
npm install
cp .env.example .env
npm run dev
```

Build:

```bash
npm run build
```

## ERP Connection

Mock mode is enabled by default:

```env
VITE_USE_MOCK=true
```

To connect to Microsoft Dynamics 365 Business Central:

```env
VITE_USE_MOCK=false
VITE_ERP_BASE_URL=https://{tenant}.api.businesscentral.dynamics.com/v2.0/{env}/api/v2.0
VITE_TOKEN_URL=https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
VITE_CLIENT_ID=...
VITE_CLIENT_SECRET=...
VITE_SCOPE=https://api.businesscentral.dynamics.com/.default
VITE_ERP_COMPANY_ID=...
```

The ERP connector is in `src/api/erpConnector.ts` and includes:

- OAuth2 `client_credentials` token request against Azure AD
- In-memory token cache and expiry refresh
- Axios interceptors for bearer token injection and 401 re-authentication
- Typed `erpGet<T>`, `erpPost<T>`, `erpPatch<T>`, and `erpDelete<T>`
- OData `$filter`, `$expand`, `$select`, `$top`, `$skip`, and `$orderby` params
- User-friendly error normalization

For production, run the client credentials flow through a backend token broker or API gateway so the client secret is not shipped to browsers.

## Modules

Finance:

- Imprest Request
- Imprest Surrender
- Staff Claim
- Petty Cash Request, Petty Cash Replenishment, Petty Cash Settlement

Facility:

- Store Requisition
- Purchase Requisition
- Fuel Request
- Transport Request
- Maintenance Request
- Transfer Order
- Gate Pass

HR:

- Leave Request
- Overtime Request
- Travel Request with expense claim link

Approvals and Reports:

- Unified Pending Approvals queue
- Approval detail with maker/checker audit trail
- Store Usage Report
- Leave Balance Report
- Gate Pass Log
- ERP Connector readiness page

## Business Rules Implemented

- Maker cannot approve own request
- Status flow: `Draft -> Pending Approval -> Approved / Rejected / Cancelled`
- Submitted requests show `Pending Approval`; saved requests show `Draft`
- Every request carries a source document number
- File uploads accept all formats and show progress/listing
- Date rules enforce no backdating where required
- Store requisitions validate item code, stock, FA tag number, budget context, and duplicate-control readiness
- Staff medical claims validate hospital category and coverage percent
- Leave requests validate balance, payroll linkage for leave without pay, and postponement fields

## Add a New Module

1. Add a module key to `src/types/erp.types.ts`.
2. Add a Zod schema and form type to `src/types/forms.types.ts`.
3. Add an endpoint wrapper in `src/api/endpoints/` using `createModuleRequest` and `listModuleRequests`.
4. Create a page with `RequestFormPage`.
5. Add the route in `src/App.tsx`.
6. Add navigation in `src/utils/constants.ts`.

The page will automatically get validation, draft/submit actions, React Query mutation handling, request table, status badges, and source-document workflow display.
