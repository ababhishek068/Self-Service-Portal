import { useMemo } from 'react'
import { navigationMenu, type NavItem } from '@/config/navigation'
import { hasAnyRole, type PortalRole } from '@/config/roles'
import { useAuth } from '@/hooks/useAuth'

const UNDER_CONSTRUCTION_MESSAGE = '🚧 Feature under construction — coming soon!'

/**
 * Filter the static navigation menu down to the items the current user's roles
 * allow. An item without a `roles` constraint is visible to everyone; an item
 * with one is shown only when the user holds at least one of those roles.
 */
function filterByRoles(items: NavItem[], userRoles: PortalRole[], userCanApprove: boolean): NavItem[] {
  return items
    .filter((item) => {
      if (item.label === 'Approvals') return userCanApprove
      return !item.roles || hasAnyRole(userRoles, item.roles)
    })
    .map((item) =>
      item.children ? { ...item, children: filterByRoles(item.children, userRoles, userCanApprove) } : item,
    )
    .filter((item) => !item.children || item.children.length > 0)
}

export function useNavigation() {
  const { employee } = useAuth()
  const userRoles = useMemo<PortalRole[]>(() => employee?.roles ?? [], [employee?.roles])
  const userCanApprove = Boolean(employee?.canApprove)

  return useMemo(() => filterByRoles(navigationMenu, userRoles, userCanApprove), [userRoles, userCanApprove])
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
