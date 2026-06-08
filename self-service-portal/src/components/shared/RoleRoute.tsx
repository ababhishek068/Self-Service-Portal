import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/usePermissions'
import type { PortalRole } from '@/config/roles'

interface RoleRouteProps {
  roles?: PortalRole[]
  /** When set, allow users who can act on the approval queue (e.g. staff + line manager). */
  requireCanApprove?: boolean
  children: ReactNode
}

/**
 * Guards a route so only users holding at least one of `roles` can view it.
 * Others see a friendly "no access" panel instead of a broken page — this
 * matters because deep links can otherwise bypass the role-filtered sidebar.
 */
export function RoleRoute({ roles, requireCanApprove, children }: RoleRouteProps) {
  const { has, canApprove } = usePermissions()

  if (requireCanApprove && canApprove) return <>{children}</>
  if (roles?.length && has(roles)) return <>{children}</>

  return (
    <PageWrapper title="Access restricted" description="You do not have permission to view this page.">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-500" />
        <div>
          <p className="text-base font-semibold text-slate-900">This area is role-restricted</p>
          <p className="mt-1 text-sm text-slate-600">
            Your account does not have the role required to open this page. If you believe this is a
            mistake, contact your administrator.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </PageWrapper>
  )
}
