import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, KeyRound, Network, RefreshCcw, ShieldCheck } from 'lucide-react'
import { env } from '@/config/env'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const connectorReadiness = async () => ({
  mode: env.ERP_BASE_URL ? 'Business Central mode' : 'Not configured',
  baseUrl: env.ERP_BASE_URL || 'Not configured',
  tokenUrl: env.TOKEN_URL || 'Not configured',
  scope: env.SCOPE,
  portalApi: env.AUTH_API_URL || 'Not configured',
  checks: [
    'Portal data served by Node backend (VITE_AUTH_API_URL)',
    'OAuth2 client_credentials token cache with expiry refresh',
    'Axios interceptors for 401 re-authentication',
    'Typed erpGet, erpPost, erpPatch, erpDelete helpers',
    'OData $filter, $select, $expand, $top, $skip, and $orderby params',
  ],
})

export function ErpConnector() {
  const readiness = useQuery({ queryKey: ['erp-connector', 'readiness'], queryFn: connectorReadiness })
  const data = readiness.data

  return (
    <PageWrapper title="ERP Connector" description="How the portal connects to Microsoft Dynamics 365 Business Central OData and REST APIs.">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Connection model</CardTitle>
            <CardDescription>Portal screens use the Node backend. This page documents the optional direct Business Central OData connector.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <Network className="mb-3 h-5 w-5 text-emerald-700" />
                <p className="font-semibold text-slate-950">Base URL</p>
                <p className="mt-1 break-all text-slate-600">{data?.baseUrl}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <KeyRound className="mb-3 h-5 w-5 text-emerald-700" />
                <p className="font-semibold text-slate-950">Token URL</p>
                <p className="mt-1 break-all text-slate-600">{data?.tokenUrl}</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Production recommendation</p>
              <p className="mt-1">
                Client credentials should be executed through a secure backend or API gateway for production. The browser connector is ready
                for integration testing, but a server-side token broker keeps the client secret out of shipped frontend code.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Readiness</CardTitle>
              <Badge variant={env.ERP_BASE_URL ? 'green' : 'yellow'}>{data?.mode}</Badge>
            </div>
            <CardDescription>Connector capabilities implemented in src/api/erpConnector.ts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(data?.checks ?? []).map((check) => (
                <li key={check} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  {check}
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                User-friendly ERP error normalization
              </div>
              <div className="flex items-center gap-2 rounded-md bg-sky-50 p-3 text-sky-800">
                <RefreshCcw className="h-4 w-4" />
                Auto refresh on expired OAuth token
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
