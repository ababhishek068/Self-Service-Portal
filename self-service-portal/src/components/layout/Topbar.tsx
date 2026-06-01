import { Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayout } from '@/context/LayoutContext'
import { useAuth } from '@/hooks/useAuth'

export function Topbar() {
  const { pageTitle, toggleSidebar, sidebarOpen, toggleMobileNav, mobileNavOpen } = useLayout()
  const { employee } = useAuth()
  const displayName = employee?.displayName?.split(' ')[0] ?? 'User'

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
            H
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-[var(--portal-navy)]">HIJRA BANK</p>
          </div>
        </div>

        <p className="hidden text-base font-bold tracking-wide text-[var(--portal-navy)] md:block lg:text-lg">
          SELF SERVICE PORTAL
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

        <div className="hidden items-center gap-2 border-l border-slate-200/80 pl-3 transition-all duration-200 hover:opacity-90 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[var(--portal-navy)] shadow-inner ring-2 ring-white transition-all duration-300 hover:scale-105 hover:ring-[var(--portal-orange)]/40 hover:shadow-md">
            <User className="h-5 w-5" />
          </div>
          <span className="hidden text-sm font-medium text-slate-800 md:inline">{displayName}</span>
        </div>
      </div>
    </header>
  )
}
