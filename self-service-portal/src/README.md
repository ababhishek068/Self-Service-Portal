# Self Service Portal — `src/` layout

This codebase follows a **layered architecture** with clear separation of
concerns. Each top-level folder has one job; barrel exports (`index.ts`) are
provided so callers can import from a single, stable surface.

```
src/
├── api/                    # Data layer
│   ├── client/             # Raw HTTP clients (essClient, erpConnector)
│   ├── endpoints/          # Typed, domain-grouped API functions
│   ├── mock/               # In-memory fake backend (VITE_USE_MOCK=true)
│   └── index.ts            # Public barrel
│
├── assets/                 # Static assets bundled into the app
│
├── components/
│   ├── ui/                 # Pure design-system primitives (shadcn-style)
│   ├── shared/             # Composite, portal-aware components
│   └── layout/             # App chrome (Sidebar, Topbar, MobileNav, …)
│
├── config/
│   ├── env.ts              # Typed env-var access (Vite import.meta.env)
│   └── navigation.ts       # Sidebar / mobile-nav structure
│
├── context/                # React context providers (consumer hooks live in `hooks/`)
│   ├── AuthContext.tsx     # Provider
│   ├── authContextValue.ts # Context object & internal types
│   ├── LayoutContext.tsx
│   └── layoutContextValue.ts
│
├── data/                   # Static catalogs and seed master data
│   ├── departments.ts
│   ├── items.ts
│   ├── hospitalCoverage.ts
│   ├── leaveTypes.ts
│   ├── moduleLabels.ts
│   └── payroll.ts
│
├── hooks/                  # Reusable hooks (data + UI)
│   ├── useAuth.ts
│   ├── useApprovals.ts
│   ├── useEmployee.ts
│   ├── useLayout.ts
│   └── useNavigation.ts
│
├── lib/                    # Tiny, framework-agnostic helpers (cn, …)
│
├── pages/                  # Route components grouped by domain
│   ├── approvals/
│   ├── auth/
│   ├── ceo/
│   ├── dashboard/
│   ├── downloads/
│   ├── facility/
│   ├── finance/
│   ├── hod/
│   ├── hr/
│   └── reports/
│
├── schemas/                # Zod request schemas + inferred form types
│   └── requestSchemas.ts
│
├── types/                  # Shared TypeScript types
│   ├── approval.ts
│   └── erp.types.ts
│
├── utils/                  # Pure functions (formatters, validators)
│   ├── formatters.ts
│   └── validators.ts
│
├── App.tsx                 # Route definitions
├── main.tsx                # React/Vite entrypoint
└── index.css               # Tailwind v4 layer + design tokens
```

## Conventions

- **Path alias** — `@/` maps to `src/` (configured in `tsconfig.app.json` and
  `vite.config.ts`). Always prefer `@/components/ui/button` over deep relative
  paths.
- **API access** — components/hooks talk to `@/api/endpoints/<domain>`; the
  endpoint files decide whether to hit the Laravel ESS backend
  (`@/api/client/essClient`) or fall back to the mock store
  (`@/api/mock/mockStore`) based on `env.USE_MOCK`.
- **Forms** — schemas in `@/schemas/requestSchemas` are the single source of
  truth; component-level types are inferred via `z.infer<...>`.
- **Master data** — anything static (department list, calendar months, etc.)
  lives in `@/data/*` so it can be replaced with a real OData feed without
  touching call sites.
- **Context split** — provider component lives in `*Context.tsx`; the bare
  `createContext()` value lives in `*ContextValue.ts`; the consumer hook
  lives in `hooks/use*.ts`. This keeps Fast Refresh happy.
