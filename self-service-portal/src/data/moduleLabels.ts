import type { PortalModuleKey } from '@/types/erp.types'

/** Human-readable label for each portal module. */
export const moduleLabels: Record<PortalModuleKey, string> = {
  imprest: 'Imprest Requisition',
  imprestSurrender: 'Imprest Surrender',
  staffClaim: 'Staff Claims',
  pettyCash: 'Petty Cash Request',
  pettyCashReplenishment: 'Petty Cash Replenishment',
  storeRequisition: 'Store Requisition',
  purchaseRequisition: 'Purchase Requisition',
  fuelRequest: 'Fuel Requisition',
  transport: 'Transport Requisition',
  maintenance: 'Maintenance Request',
  transferOrder: 'Transfer Orders',
  vehicleTransfer: 'Vehicle Transfer',
  gatePass: 'Gate Pass',
  leave: 'Leave Requisition',
  overtime: 'Overtime Request',
  travel: 'Travel Request',
  salaryAdvance: 'Salary Advance',
  training: 'Training Request',
  documentRequisition: 'Document Requisition',
}

/** Ordered list of statuses a request can transition through. */
export const statusFlow = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Cancelled',
  'Posted',
  'Pending',
] as const

export type StatusFlowValue = (typeof statusFlow)[number]
