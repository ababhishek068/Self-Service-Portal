import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface LayoutContextValue {
  pageTitle: string
  setPageTitle: (title: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = useCallback(() => setSidebarOpen((value) => !value), [])

  const value = useMemo(
    () => ({ pageTitle, setPageTitle, sidebarOpen, setSidebarOpen, toggleSidebar }),
    [pageTitle, sidebarOpen, toggleSidebar],
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within LayoutProvider')
  return context
}
