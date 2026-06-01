import { useMemo } from 'react'
import { navigationMenu, type NavItem } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'

const UNDER_CONSTRUCTION_MESSAGE = '🚧 Feature under construction — coming soon!'

/**
 * Filter the static navigation menu to only the items the current user is
 * allowed to see. Mirrors the `@if(session('authUser')['CEO'])` and
 * `@if(session('authUser')['HOD'] != null)` checks in the reference ESS
 * Laravel sidebar.
 */
function filterByRoles(items: NavItem[], { isCEO, isHOD }: { isCEO: boolean; isHOD: boolean }): NavItem[] {
  return items
    .filter((item) => {
      if (item.requiresRole === 'CEO' && !isCEO) return false
      if (item.requiresRole === 'HOD' && !isHOD) return false
      return true
    })
    .map((item) =>
      item.children ? { ...item, children: filterByRoles(item.children, { isCEO, isHOD }) } : item,
    )
    .filter((item) => !item.children || item.children.length > 0)
}

export function useNavigation() {
  const { employee } = useAuth()
  const isCEO = Boolean(employee?.isCEO)
  const isHOD = Boolean(employee?.isHOD)

  return useMemo(() => filterByRoles(navigationMenu, { isCEO, isHOD }), [isCEO, isHOD])
}

/**
 * Click handler factory for nav links flagged as `underConstruction`.
 * Shows a notice instead of routing — matches the inline `alert(...)`
 * handlers used in the reference ESS sidebar.
 */
export function handleUnderConstructionClick(event: { preventDefault: () => void }) {
  event.preventDefault()
  if (typeof window !== 'undefined') {
    window.alert(UNDER_CONSTRUCTION_MESSAGE)
  }
}
