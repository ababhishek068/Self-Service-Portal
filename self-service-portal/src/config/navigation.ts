import type { LucideIcon } from 'lucide-react'
import {
  erpConnectorRoles,
  gatePassReportRoles,
  leaveBalanceReportRoles,
  storeUsageReportRoles,
} from '@/config/roleAccess'
import type { PortalRole } from '@/config/roles'
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  Car,
  CircleX,
  ClipboardCheck,
  ClipboardCopy,
  Clock3,
  CloudDownload,
  Crown,
  DoorOpen,
  FileText,
  Fuel,
  Gauge,
  Home,
  KeyRound,
  Landmark,
  Link2,
  PackageCheck,
  Plane,
  ReceiptText,
  ShoppingCart,
  Store,
  Ticket,
  UserRound,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react'

export interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  children?: NavItem[]
  /** When true, the link shows a "coming soon" notice instead of routing */
  underConstruction?: boolean
  /**
   * When set, only render this item if the user holds at least one of these
   * roles. Omit to make the item visible to every authenticated user.
   */
  roles?: PortalRole[]
}

/**
 * Navigation reflects the ESS portal module structure. Order, labels and
 * grouping are kept in sync with the ERP self-service scope so users have a
 * consistent mental model across the system.
 */
export const navigationMenu: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: Gauge },
  {
    label: 'HR Services',
    icon: FileText,
    children: [
      { label: 'Leave Requisition', path: '/hr/leave-request', icon: Home },
      { label: 'Leave Statement', path: '/hr/leave-statement', icon: ReceiptText },
      { label: 'Attendance', path: '/hr/attendance', icon: UsersRound },
      { label: 'Performance', path: '/hr/performance', icon: BarChart3 },
      { label: 'Training Request', path: '/hr/training-request', icon: FileText },
      { label: 'Payslip', path: '/hr/payslip', icon: Wallet },
      { label: 'Salary Advance', path: '/hr/salary-advance', icon: Banknote },
      { label: 'Document Requisition', path: '/hr/document-requisition', icon: FileText },
      { label: 'Overtime Request', path: '/hr/overtime-request', icon: Clock3 },
      { label: 'Travel Request', path: '/hr/travel-request', icon: Plane },
    ],
  },
  {
    label: 'Finance Services',
    icon: Landmark,
    children: [
      { label: 'Imprest Requisition', path: '/finance/imprest', icon: Banknote },
      { label: 'Imprest Surrender', path: '/finance/imprest-surrender', icon: ReceiptText },
      { label: 'Staff Claims', path: '/finance/staff-claim', icon: BadgeCheck },
      { label: 'Petty Cash Request', path: '/finance/petty-cash', icon: Banknote },
      { label: 'Petty Cash Replenishment', path: '/finance/petty-cash-replenishment', icon: ReceiptText },
    ],
  },
  {
    label: 'Facilities',
    icon: Building2,
    children: [
      { label: 'Purchase Requisition', path: '/facility/purchase-requisition', icon: ShoppingCart },
      { label: 'Store Requisition', path: '/facility/store-requisition', icon: Store },
      { label: 'Transport Requisition', path: '/facility/transport-request', icon: Car },
      { label: 'Fuel Requisition', path: '/facility/fuel-request', icon: Fuel },
      { label: 'Work Tickets', path: '/facility/work-tickets', icon: Ticket },
      { label: 'Maintenance Request', path: '/facility/maintenance-request', icon: Wrench },
      { label: 'Transfer Orders', path: '/facility/transfer-order', icon: PackageCheck },
      { label: 'Gate Pass', path: '/facility/gate-pass', icon: DoorOpen },
      { label: 'Vehicle Transfer', path: '/facility/vehicle-transfer', icon: Car },
    ],
  },
  {
    label: 'Approvals',
    icon: ClipboardCheck,
    children: [
      { label: 'Pending Approval', path: '/approvals', icon: ClipboardCopy },
      { label: 'Approved Documents', path: '/approvals/approved', icon: ClipboardCheck },
      { label: 'Rejected Documents', path: '/approvals/rejected', icon: CircleX },
    ],
  },
  {
    label: 'CEO Function',
    icon: Crown,
    roles: ['ceo'],
    children: [{ label: 'Payroll Master Roll', path: '/ceo/master-roll', icon: UsersRound }],
  },
  {
    label: 'HOD Function',
    icon: UsersRound,
    roles: ['hod'],
    children: [
      { label: 'Department Staff', path: '/hod/team-requests', icon: UsersRound },
      { label: 'Staff on Leave', path: '/hod/staff-on-leave', icon: Plane },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Leave Balance Report', path: '/reports/leave-balance', icon: BarChart3, roles: leaveBalanceReportRoles },
      { label: 'Store Usage Report', path: '/reports/store-usage', icon: Store, roles: storeUsageReportRoles },
    ],
  },
  {
    label: 'HR Downloads',
    icon: CloudDownload,
    children: [
      { label: 'Document Downloads', path: '/downloads/documents', icon: FileText },
      { label: 'Gate Pass Log', path: '/reports/gate-pass-log', icon: DoorOpen, roles: gatePassReportRoles },
      { label: 'ERP Connector', path: '/reports/erp-connector', icon: Link2, roles: erpConnectorRoles },
    ],
  },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Change Password', path: '/change-password', icon: KeyRound },
]
