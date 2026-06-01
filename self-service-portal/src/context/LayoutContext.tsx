import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface LayoutContextValue {
  pageTitle: string
  setPageTitle: (title: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void
  toggleMobileNav: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleSidebar = useCallback(() => setSidebarOpen((value) => !value), [])
  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileNavOpen((value) => !value), [])

  // Lock background scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileNavOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileNavOpen])

  const value = useMemo(
    () => ({
      pageTitle,
      setPageTitle,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      mobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
    }),
    [pageTitle, sidebarOpen, toggleSidebar, mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav],
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within LayoutProvider')
  return context
}
