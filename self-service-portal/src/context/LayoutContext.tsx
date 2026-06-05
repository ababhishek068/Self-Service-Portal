import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LayoutContext } from './layoutContextValue'

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
