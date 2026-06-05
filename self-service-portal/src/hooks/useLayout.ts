import { useContext } from 'react'
import { LayoutContext } from '@/context/layoutContextValue'

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within LayoutProvider')
  return context
}
