import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { type NavItem } from '@/config/navigation'
import { useLayout } from '@/hooks/useLayout'
import { handleUnderConstructionClick, useNavigation } from '@/hooks/useNavigation'
import { cn } from '@/lib/utils'
import { brand } from '@/config/brand'

function isGroupActive(item: NavItem, pathname: string): boolean {
  if (item.path) return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
  return item.children?.some((child) => isGroupActive(child, pathname)) ?? false
}

function NavLeaf({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  if (!item.path) return null
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end
      onClick={item.underConstruction ? handleUnderConstructionClick : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 py-2.5 text-sm text-white/95 transition-all duration-200',
          depth >= 2 ? 'pl-16 pr-4' : depth === 1 ? 'pl-11 pr-4' : 'px-4',
          isActive && !item.underConstruction
            ? 'portal-nav-active-bar animate-nav-active bg-gradient-to-r from-[var(--portal-orange)] to-[#f97316] font-medium text-white shadow-[inset_3px_0_0_#fff,0_0_24px_var(--portal-glow-orange)]'
            : 'hover:bg-white/10 hover:pl-[calc(1rem+2px)] hover:shadow-[inset_3px_0_0_rgba(255,255,255,0.35)]',
          depth === 1 && 'hover:pl-[calc(2.75rem+2px)]',
          depth >= 2 && 'hover:pl-[calc(4rem+2px)]',
          item.underConstruction && 'opacity-75',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              isActive && !item.underConstruction
                ? 'scale-110'
                : 'opacity-85 group-hover:scale-105 group-hover:opacity-100',
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.underConstruction ? (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/80">
              Soon
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation()
  const active = isGroupActive(item, location.pathname)
  const [open, setOpen] = useState(active)
  const Icon = item.icon

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value: boolean) => !value)}
        className={cn(
          'flex w-full items-center gap-2.5 py-2.5 text-left text-sm text-white transition-all duration-200 hover:bg-white/10',
          depth > 0 ? 'pl-9 pr-4' : 'px-4',
          active && 'bg-white/5',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" />
        <span className="flex-1 font-medium">{item.label}</span>
        <ChevronDown className={cn('chevron-rotate h-4 w-4 opacity-80')} data-open={open ? 'true' : 'false'} />
      </button>

      <div className="nav-submenu-grid bg-[var(--portal-navy-panel)]" data-open={open ? 'true' : 'false'}>
        <div className="nav-submenu-inner">
          {item.children?.map((child) =>
            child.children
              ? <NavGroup key={child.label} item={child} depth={depth + 1} />
              : <NavLeaf key={child.label} item={child} depth={depth + 1} />,
          )}
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen } = useLayout()
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const menu = useNavigation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = navRef.current?.querySelector('[aria-current="page"]')
      active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, sidebarOpen])

  return (
    <aside
      className={cn(
        'portal-sidebar-bg animate-sidebar-in hidden h-full shrink-0 flex-col overflow-hidden text-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex',
        sidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-0',
      )}
    >
      <div className="portal-sidebar-brand portal-shimmer-bar shrink-0 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{brand.company}</p>
        <p className="text-sm font-bold text-white">{brand.productShort}</p>
      </div>
      <nav
        ref={navRef}
        className="portal-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-1"
        aria-label="Main navigation"
      >
        {menu.map((item, index) => (
          <div
            key={item.label}
            className="animate-sidebar-in"
            style={{ animationDelay: `${Math.min(index * 25, 200)}ms` }}
          >
            {item.children ? <NavGroup item={item} /> : <NavLeaf item={item} />}
          </div>
        ))}
      </nav>
    </aside>
  )
}
