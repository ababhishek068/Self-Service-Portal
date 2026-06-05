import { createContext } from 'react'

export interface LayoutContextValue {
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

export const LayoutContext = createContext<LayoutContextValue | null>(null)
