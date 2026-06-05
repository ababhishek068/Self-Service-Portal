import { useEffect, type ReactNode } from 'react'
import { useLayout } from '@/hooks/useLayout'

interface PageWrapperProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  showPageHeading?: boolean
}

export function PageWrapper({ title, description, actions, children, showPageHeading = true }: PageWrapperProps) {
  const { setPageTitle } = useLayout()

  useEffect(() => {
    setPageTitle(title)
  }, [title, setPageTitle])

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {(showPageHeading || actions) && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {showPageHeading ? (
              <div className="animate-page-in-subtle min-w-0">
                <h1 className="portal-page-title text-lg font-semibold italic sm:text-xl">{title}</h1>
                {description ? <p className="mt-0.5 text-sm text-slate-600">{description}</p> : null}
              </div>
            ) : (
              <span />
            )}
            {actions ? (
              <div
                className="animate-page-in-subtle flex w-full shrink-0 flex-wrap gap-2 sm:w-auto"
                style={{ animationDelay: '60ms' }}
              >
                {actions}
              </div>
            ) : null}
          </div>
        )}
        <div className="animate-page-in-subtle" style={{ animationDelay: '80ms' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
