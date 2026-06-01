import { PageWrapper } from '@/components/layout/PageWrapper'
import { Construction } from 'lucide-react'

export function VehicleTransfer() {
  return (
    <PageWrapper title="Vehicle Transfer">
      <div className="portal-panel mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
        <Construction className="h-10 w-10 text-[var(--portal-orange)]" />
        <h2 className="text-lg font-semibold text-[var(--portal-navy)]">Coming soon</h2>
        <p className="text-sm text-slate-600">
          Vehicle transfer requests will be available in an upcoming release. Please use the Transfer Orders module
          for inventory transfers in the meantime.
        </p>
      </div>
    </PageWrapper>
  )
}
