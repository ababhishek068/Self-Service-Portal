import { useState } from 'react'
import { LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayout } from '@/hooks/useLayout'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { brand } from '@/config/brand'

export function Topbar() {
  const { pageTitle, toggleSidebar, sidebarOpen, toggleMobileNav, mobileNavOpen } = useLayout()
  const { employee, logout } = useAuth()
  const { primaryRoleShortLabel } = usePermissions()
  const displayName = employee?.displayName?.split(' ')[0] ?? 'User'
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="portal-topbar portal-safe-pt z-30 shrink-0 border-b-2 border-[var(--portal-navy)]">
      <div className="portal-topbar-glow" aria-hidden />
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-[var(--portal-navy)] transition-transform duration-200 hover:bg-slate-100 active:scale-95 lg:hidden"
          onClick={toggleMobileNav}
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden h-10 w-10 shrink-0 text-[var(--portal-navy)] transition-transform duration-200 hover:scale-105 hover:bg-slate-100 active:scale-95 lg:flex"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={sidebarOpen}
        >
          <Menu
            className="h-5 w-5 transition-transform duration-300"
            style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 via-[var(--portal-navy)] to-[var(--portal-orange)] text-xs font-bold text-white shadow-lg ring-2 ring-white/80 transition-transform duration-300 hover:scale-110 hover:shadow-[0_0_20px_var(--portal-glow-orange)]">
            {brand.monogram}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-[10rem] truncate text-sm font-bold uppercase leading-tight text-[var(--portal-navy)] sm:max-w-[14rem] lg:max-w-none">
              {brand.company}
            </p>
          </div>
        </div>

        <p className="hidden text-base font-bold tracking-wide text-[var(--portal-navy)] md:block lg:text-lg">
          {brand.product.toUpperCase()}
        </p>

        <p
          key={pageTitle}
          className="animate-title-in ml-auto min-w-0 max-w-[55vw] truncate rounded-full bg-gradient-to-r from-slate-100 to-blue-50/80 px-3 py-1 text-xs font-semibold text-[var(--portal-navy)] shadow-sm ring-1 ring-[var(--portal-navy)]/10 sm:max-w-none sm:px-4 sm:py-1.5 sm:text-sm lg:mr-6"
          title={pageTitle}
        >
          <span className="bg-gradient-to-r from-[var(--portal-navy)] to-[#0055aa] bg-clip-text text-transparent">
            {pageTitle}
          </span>
        </p>

        <div className="flex items-center gap-2 border-l border-slate-200/80 pl-2 transition-all duration-200 sm:pl-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[var(--portal-navy)] shadow-inner ring-2 ring-white transition-all duration-300 hover:scale-105 hover:ring-[var(--portal-orange)]/40 hover:shadow-md sm:flex">
            <User className="h-5 w-5" />
          </div>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-sm font-medium text-slate-800">{displayName}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--portal-orange)]">
              {primaryRoleShortLabel}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out"
            className="h-9 gap-1.5 text-[var(--portal-navy)] transition-colors duration-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden text-sm font-medium md:inline">{loggingOut ? 'Signing out…' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
