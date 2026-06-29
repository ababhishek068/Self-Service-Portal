import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, X } from 'lucide-react'
import { type NavItem } from '@/config/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useLayout } from '@/hooks/useLayout'
import { handleUnderConstructionClick, useNavigation } from '@/hooks/useNavigation'
import { cn } from '@/lib/utils'
import { brand } from '@/config/brand'

function mobileGroupActive(item: NavItem, pathname: string): boolean {
  if (item.path) return pathname === item.path || pathname.startsWith(`${item.path}/`)
  return item.children?.some((child) => mobileGroupActive(child, pathname)) ?? false
}

function MobileNavGroup({
  item,
  onNavigate,
  depth = 0,
}: {
  item: NavItem
  onNavigate: () => void
  depth?: number
}) {
  const location = useLocation()
  const hasActive = mobileGroupActive(item, location.pathname)
  const [open, setOpen] = useState(hasActive)
  const Icon = item.icon

  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  if (!item.children) return null

  return (
    <div className="border-b border-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 py-3 text-left text-[15px] font-medium text-white active:bg-white/10',
          depth > 0 ? 'pl-9 pr-4' : 'px-4',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className="chevron-rotate h-4 w-4 opacity-80" data-open={open ? 'true' : 'false'} />
      </button>
      <div className="nav-submenu-grid bg-[var(--portal-navy-panel)]" data-open={open ? 'true' : 'false'}>
        <div className="nav-submenu-inner pb-1">
          {item.children.map((child) =>
            child.children ? (
              <MobileNavGroup key={child.label} item={child} onNavigate={onNavigate} depth={depth + 1} />
            ) : child.path ? (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={(event) => {
                  if (child.underConstruction) {
                    handleUnderConstructionClick(event)
                    return
                  }
                  onNavigate()
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 py-2.5 pr-4 text-sm text-white/95 transition-colors duration-200',
                    depth > 0 ? 'pl-16' : 'pl-12',
                    isActive && !child.underConstruction
                      ? 'bg-gradient-to-r from-[var(--portal-orange)] to-[#f97316] font-medium shadow-[0_0_16px_var(--portal-glow-orange)]'
                      : 'active:bg-white/10',
                    child.underConstruction && 'opacity-75',
                  )
                }
              >
                <span className="flex-1">{child.label}</span>
                {child.underConstruction ? (
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/80">
                    Soon
                  </span>
                ) : null}
              </NavLink>
            ) : null,
          )}
        </div>
      </div>
    </div>
  )
}

export function MobileNav() {
  const { mobileNavOpen, closeMobileNav } = useLayout()
  const { employee, logout } = useAuth()
  const location = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)
  const menu = useNavigation()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      closeMobileNav()
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  useEffect(() => {
    closeMobileNav()
  }, [location.pathname, closeMobileNav])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileNav()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileNavOpen, closeMobileNav])

  const displayName = employee?.displayName ?? 'User'

  return (
    <div className={cn('fixed inset-0 z-50 lg:hidden', mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        aria-hidden
        onClick={closeMobileNav}
        className={cn(
          'absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300',
          mobileNavOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        className={cn(
          'portal-sidebar-bg portal-safe-pt portal-safe-pb absolute inset-y-0 left-0 flex w-[min(86vw,20rem)] flex-col text-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="portal-sidebar-brand portal-shimmer-bar relative flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">{brand.company}</p>
            <p className="text-sm font-bold text-white">{brand.product}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close navigation"
            className="h-10 w-10 text-white hover:bg-white/10 active:scale-95"
            onClick={closeMobileNav}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--portal-orange)] to-[#f97316] text-sm font-bold text-white shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/60">{employee?.employeeNo ?? 'Signed in'}</p>
          </div>
        </div>

        <nav className="portal-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
          {menu.map((item) =>
            item.path ? (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={(event) => {
                  if (item.underConstruction) {
                    handleUnderConstructionClick(event)
                    return
                  }
                  closeMobileNav()
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 border-b border-white/5 px-4 py-3 text-[15px] text-white transition-colors duration-200',
                    isActive && !item.underConstruction
                      ? 'bg-gradient-to-r from-[var(--portal-orange)] to-[#f97316] font-medium shadow-[0_0_16px_var(--portal-glow-orange)]'
                      : 'active:bg-white/10',
                    item.underConstruction && 'opacity-75',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <MobileNavGroup key={item.label} item={item} onNavigate={closeMobileNav} />
            ),
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-500/90 active:scale-[0.98] disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </aside>
    </div>
  )
}
