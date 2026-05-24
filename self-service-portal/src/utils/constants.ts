import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  Car,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  CloudDownload,
  DoorOpen,
  FileText,
  Fuel,
  Gauge,
  Home,
  KeyRound,
  Landmark,
  PackageCheck,
  Plane,
  ReceiptText,
  ShoppingCart,
  Store,
  UserRound,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { PortalModuleKey } from '@/types/erp.types'

export const departments = [
  { code: 'BO', name: 'Branch Operations', branchCode: 'HO', limit: 120000 },
  { code: 'FIN', name: 'Finance', branchCode: 'HO', limit: 180000 },
  { code: 'HR', name: 'Human Resources', branchCode: 'HO', limit: 90000 },
  { code: 'ITN', name: 'IT Network and Infrastructure', branchCode: 'HO', limit: 75000 },
  { code: 'FAC', name: 'Facility Management', branchCode: 'HO', limit: 150000 },
] as const

export const itemMaster = [
  { code: 'ST032', description: 'Photocopy paper', uom: 'Pcs', stock: 480, unitPrice: 180, categoryCode: 'ST', isFixedAsset: false },
  { code: 'ST067', description: 'Kyocera toner cartridge', uom: 'Pcs', stock: 42, unitPrice: 3900, categoryCode: 'ST', isFixedAsset: false },
  { code: 'FA112', description: 'Laptop computer', uom: 'Pcs', stock: 11, unitPrice: 68000, categoryCode: 'IT', isFixedAsset: true },
  { code: 'FA220', description: 'Office chair', uom: 'Pcs', stock: 33, unitPrice: 9800, categoryCode: 'FF', isFixedAsset: true },
  { code: 'SRV210', description: 'Generator maintenance service', uom: 'Job', stock: 999, unitPrice: 12500, categoryCode: 'SRV', isFixedAsset: false },
] as const

export const hospitalCoverage = [
  { category: 'Panel Hospital A', coveragePercent: 90 },
  { category: 'Panel Hospital B', coveragePercent: 80 },
  { category: 'Non-panel Hospital', coveragePercent: 50 },
] as const

export interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  children?: NavItem[]
}

export const navigationMenu: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: Gauge },
  {
    label: 'HR Services',
    icon: FileText,
    children: [
      { label: 'Leave Requisition', path: '/hr/leave-request', icon: Home },
      { label: 'Leave Statement', path: '/hr/leave-statement', icon: Home },
      { label: 'Attendance', path: '/hr/attendance', icon: UserRound },
      { label: 'Performance', path: '/hr/performance', icon: BarChart3 },
      { label: 'Training Request', path: '/hr/training-request', icon: Home },
      { label: 'Payslip', path: '/hr/payslip', icon: Wallet },
      { label: 'Salary Advance', path: '/hr/salary-advance', icon: Home },
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
      { label: 'Maintenance Request', path: '/facility/maintenance-request', icon: Wrench },
      { label: 'Transfer Orders', path: '/facility/transfer-order', icon: PackageCheck },
      { label: 'Gate Pass', path: '/facility/gate-pass', icon: DoorOpen },
    ],
  },
  {
    label: 'Approvals',
    icon: ClipboardCheck,
    children: [{ label: 'Pending Approvals', path: '/approvals', icon: ClipboardCheck }],
  },
  {
    label: 'HOD Function',
    icon: UsersRound,
    children: [{ label: 'Team Requests', path: '/hod/team-requests', icon: UsersRound }],
  },
  {
    label: 'HR Downloads',
    icon: CloudDownload,
    children: [
      { label: 'Leave Balance Report', path: '/reports/leave-balance', icon: BarChart3 },
      { label: 'Store Usage Report', path: '/reports/store-usage', icon: Store },
      { label: 'Gate Pass Log', path: '/reports/gate-pass-log', icon: DoorOpen },
    ],
  },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Change Password', path: '/change-password', icon: KeyRound },
]

/** @deprecated Use navigationMenu — kept for gradual migration */
export const navigationGroups = navigationMenu
  .filter((item): item is NavItem & { path: string } => Boolean(item.path))
  .map((item) => ({ label: item.label, items: [{ label: item.label, path: item.path, icon: item.icon }] }))

export { ChevronDown }

export const moduleLabels: Record<PortalModuleKey, string> = {
  imprest: 'Imprest Requisition',
  imprestSurrender: 'Imprest Surrender',
  staffClaim: 'Staff Claims',
  pettyCash: 'Petty Cash Request',
  storeRequisition: 'Store Requisition',
  purchaseRequisition: 'Purchase Requisition',
  fuelRequest: 'Fuel Requisition',
  transport: 'Transport Requisition',
  maintenance: 'Maintenance Request',
  transferOrder: 'Transfer Orders',
  gatePass: 'Gate Pass',
  leave: 'Leave Requisition',
  overtime: 'Overtime Request',
  travel: 'Travel Request',
}

export const statusFlow = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled', 'Posted', 'Pending'] as const

export const leaveTypes = [
  '--select--',
  'Annual Leave',
  'Postnatal Leave/Maternity',
  'Wedding leave',
  'Mourning Leave',
  'Sick leave',
  'leave without Pay',
  'Special Leave',
  'Prenatal Leave/Maternity',
] as const

export const payrollYears = ['2025', '2026', '2027'] as const
export const payrollMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const
