import { differenceInCalendarDays, isBefore, isSameDay, parseISO } from 'date-fns'
import { z } from 'zod'

const today = () => new Date()
const isValidDateString = (value: string) => {
  const parsed = parseISO(value)
  return !Number.isNaN(parsed.getTime())
}

const dateField = z.string().min(1, 'Date is required').refine(isValidDateString, 'Use a valid date')
const moneyField = z.coerce.number().positive('Amount must be greater than zero')
const quantityField = z.coerce.number().positive('Quantity must be greater than zero')
const optionalText = z.string().optional().default('')
const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  size: z.number(),
  progress: z.number(),
  uploadedAt: z.string(),
})

export const imprestLineSchema = z.object({
  expenseType: z.string().min(2, 'Expense type is required'),
  description: z.string().min(3, 'Description is required'),
  amount: moneyField,
})

export const imprestRequestSchema = z
  .object({
    requisitionDate: dateField.refine(
      (value) => isSameDay(parseISO(value), today()),
      'Requisition date must equal the ERP working date',
    ),
    startDate: dateField,
    returnDate: dateField,
    departmentCode: z.string().min(1, 'Department is required'),
    jobGrade: z.string().min(1, 'Job grade is required'),
    placeOfDuty: z.string().min(2, 'Place of duty is required'),
    employeeAccountNumber: z.string().min(6, 'Employee account number is required'),
    responsibleCenter: z.string().min(2, 'Responsible center is required'),
    purpose: z.string().min(8, 'Purpose is required'),
    lines: z.array(imprestLineSchema).min(1, 'Add at least one imprest line'),
    attachments: z.array(attachmentSchema).default([]),
    submit: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (isBefore(parseISO(data.returnDate), parseISO(data.startDate))) {
      ctx.addIssue({
        code: 'custom',
        path: ['returnDate'],
        message: 'Return date must be the same as or later than start date',
      })
    }
  })

export const imprestSurrenderSchema = z.object({
  imprestNo: z.string().min(3, 'Imprest document number is required'),
  surrenderDate: dateField,
  amountUsed: moneyField,
  amountReturned: z.coerce.number().min(0, 'Returned amount cannot be negative'),
  outstandingBalance: z.coerce.number().min(0).default(0),
  notes: z.string().min(5, 'Surrender notes are required'),
  attachments: z.array(attachmentSchema).min(1, 'Attachment is required'),
})

export const staffClaimSchema = z
  .object({
    claimType: z.enum(['Per Diem & Accommodation', 'Medical', 'Other']),
    claimDate: dateField,
    departmentCode: z.string().min(1, 'Department is required'),
    jobGrade: z.string().min(1, 'Job grade is required'),
    placeOfDuty: z.string().min(2, 'Place of duty is required'),
    employeeAccountNumber: z.string().min(6, 'Employee account number is required'),
    hospitalCategory: optionalText,
    coveragePercent: z.coerce.number().min(0).max(100).default(0),
    grossAmount: moneyField,
    description: z.string().min(8, 'Claim description is required'),
    attachments: z.array(attachmentSchema).min(1, 'Supporting document is required'),
  })
  .superRefine((data, ctx) => {
    if (data.claimType === 'Medical') {
      if (!data.hospitalCategory) {
        ctx.addIssue({
          code: 'custom',
          path: ['hospitalCategory'],
          message: 'Hospital category is required for medical claims',
        })
      }
      if (data.coveragePercent <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['coveragePercent'],
          message: 'Coverage percent is required for medical claims',
        })
      }
    }
  })

export const pettyCashSchema = z.object({
  activity: z.enum(['Request', 'Petty Cash Replenishment', 'Petty Cash Settlement']),
  departmentCode: z.string().min(1, 'Department is required'),
  requestDate: dateField,
  amount: moneyField,
  limitAmount: moneyField,
  costCenter: z.string().min(2, 'Cost center is required'),
  purpose: z.string().min(8, 'Purpose is required'),
  attachments: z.array(attachmentSchema).default([]),
})

export const storeRequisitionLineSchema = z
  .object({
    itemCode: z.string().min(2, 'Item code is required'),
    description: z.string().min(2, 'Description is required'),
    quantity: quantityField,
    uom: z.string().min(1, 'UoM is required'),
    availableStock: z.coerce.number().min(0),
    isFixedAsset: z.boolean().default(false),
    faTagNumber: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.quantity > data.availableStock) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Insufficient stock blocks posting',
      })
    }
    if (data.isFixedAsset && !/^HB\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9]+\/\d{3,5}\/\d{4}$/.test(data.faTagNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['faTagNumber'],
        message: 'FA Tag must follow HB/{dept}/{category}/{item}/{seq}/{year}',
      })
    }
  })

export const storeRequisitionSchema = z.object({
  requestDate: dateField,
  departmentCode: z.string().min(1, 'Department is required'),
  budgetAvailable: z.coerce.number().min(0),
  justification: z.string().min(8, 'Justification is required'),
  lines: z.array(storeRequisitionLineSchema).min(1, 'Add at least one store item'),
  attachments: z.array(attachmentSchema).default([]),
})

export const purchaseRequisitionLineSchema = z.object({
  itemType: z.enum(['Item', 'Service', 'Fixed Asset']),
  quantity: quantityField,
  uom: z.string().min(1, 'UoM is required'),
  description: z.string().min(3, 'Description is required'),
  brand: optionalText,
  standard: optionalText,
  specification: z.string().min(3, 'Specification is required'),
  stake: z.string().min(2, 'Stakeholder is required'),
  amount: moneyField,
})

export const purchaseRequisitionSchema = z.object({
  requestDate: dateField,
  departmentCode: z.string().min(1, 'Department is required'),
  responsibleCenter: z.string().min(2, 'Responsible center is required'),
  reason: z.string().min(8, 'Business reason is required'),
  lines: z.array(purchaseRequisitionLineSchema).min(1, 'Add at least one purchase line'),
  attachments: z.array(attachmentSchema).min(1, 'Attachment is required'),
})

export const fuelRequestSchema = z.object({
  requestDate: dateField,
  vehicleNo: z.string().min(2, 'Vehicle number is required'),
  driverName: z.string().min(2, 'Driver name is required'),
  liters: quantityField,
  odometer: z.coerce.number().positive('Odometer is required'),
  purpose: z.string().min(8, 'Purpose is required'),
})

export const transportRequestSchema = z
  .object({
    transportType: z.enum(['City', 'Field']),
    tripDate: dateField,
    destination: z.string().min(2, 'Destination is required'),
    passengers: z.array(z.object({ name: z.string().min(2, 'Passenger name is required') })).min(1, 'Add at least one passenger'),
    purpose: z.string().min(8, 'Purpose is required'),
  })
  .refine((data) => !isBefore(parseISO(data.tripDate), today()), {
    path: ['tripDate'],
    message: 'Trip date cannot be backdated',
  })

export const maintenanceRequestSchema = z.object({
  requestDate: dateField,
  faTagNumber: z.string().regex(/^HB\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9]+\/\d{3,5}\/\d{4}$/, 'Use a valid HB FA tag number'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  location: z.string().min(2, 'Location is required'),
  issueDescription: z.string().min(10, 'Issue description is required'),
  attachments: z.array(attachmentSchema).default([]),
})

export const transferOrderSchema = z
  .object({
    transferType: z.enum(['Temporary', 'Permanent']),
    assetTagNumber: z.string().min(3, 'Asset or vehicle tag is required'),
    fromEmployee: z.string().min(2, 'Current custodian is required'),
    toEmployee: z.string().min(2, 'Receiving custodian is required'),
    handoverDate: dateField,
    returnDate: optionalText,
    notes: z.string().min(5, 'Notes are required'),
  })
  .superRefine((data, ctx) => {
    if (data.transferType === 'Temporary' && !data.returnDate) {
      ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return date is required for temporary handover' })
    }
  })

export const gatePassSchema = z
  .object({
    gatePassType: z.enum(['Returnable', 'Non-Returnable']),
    assetTagNumber: optionalText,
    destination: z.string().min(2, 'Destination is required'),
    issueDate: dateField,
    returnDate: optionalText,
    reason: z.string().min(8, 'Reason is required'),
    attachments: z.array(attachmentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.gatePassType === 'Returnable' && !data.returnDate) {
      ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return date is required for returnable gate pass' })
    }
  })

export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(['Annual', 'Sick', 'Maternity', 'Paternity', 'Leave Without Pay']),
    startDate: dateField,
    endDate: dateField,
    balanceBefore: z.coerce.number().min(0),
    reason: z.string().min(5, 'Reason is required'),
    payrollLinked: z.boolean().default(false),
    isPostponement: z.boolean().default(false),
    newStartDate: optionalText,
    newEndDate: optionalText,
    postponementReason: optionalText,
  })
  .superRefine((data, ctx) => {
    const days = differenceInCalendarDays(parseISO(data.endDate), parseISO(data.startDate)) + 1
    if (days <= 0) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after start date' })
    }
    if (data.leaveType === 'Annual' && days > data.balanceBefore) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Leave days exceed available balance' })
    }
    if (data.leaveType === 'Leave Without Pay' && !data.payrollLinked) {
      ctx.addIssue({ code: 'custom', path: ['payrollLinked'], message: 'Leave without pay must be linked to payroll' })
    }
    if (data.isPostponement && (!data.newStartDate || !data.newEndDate || !data.postponementReason)) {
      ctx.addIssue({ code: 'custom', path: ['postponementReason'], message: 'New dates and reason are required for postponement' })
    }
  })

export const overtimeRequestSchema = z.object({
  workDate: dateField,
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  hours: z.coerce.number().positive('Hours are required').max(24),
  reason: z.string().min(8, 'Reason is required'),
})

export const travelRequestSchema = z.object({
  travelDate: dateField,
  returnDate: dateField,
  destination: z.string().min(2, 'Destination is required'),
  purpose: z.string().min(8, 'Purpose is required'),
  estimatedExpense: moneyField,
  createExpenseClaim: z.boolean().default(true),
})

export const requestSchemas = {
  imprest: imprestRequestSchema,
  imprestSurrender: imprestSurrenderSchema,
  staffClaim: staffClaimSchema,
  pettyCash: pettyCashSchema,
  storeRequisition: storeRequisitionSchema,
  purchaseRequisition: purchaseRequisitionSchema,
  fuelRequest: fuelRequestSchema,
  transport: transportRequestSchema,
  maintenance: maintenanceRequestSchema,
  transferOrder: transferOrderSchema,
  gatePass: gatePassSchema,
  leave: leaveRequestSchema,
  overtime: overtimeRequestSchema,
  travel: travelRequestSchema,
}

export type ImprestRequestForm = z.infer<typeof imprestRequestSchema>
export type ImprestSurrenderForm = z.infer<typeof imprestSurrenderSchema>
export type StaffClaimForm = z.infer<typeof staffClaimSchema>
export type PettyCashForm = z.infer<typeof pettyCashSchema>
export type StoreRequisitionForm = z.infer<typeof storeRequisitionSchema>
export type PurchaseRequisitionForm = z.infer<typeof purchaseRequisitionSchema>
export type FuelRequestForm = z.infer<typeof fuelRequestSchema>
export type TransportRequestForm = z.infer<typeof transportRequestSchema>
export type MaintenanceRequestForm = z.infer<typeof maintenanceRequestSchema>
export type TransferOrderForm = z.infer<typeof transferOrderSchema>
export type GatePassForm = z.infer<typeof gatePassSchema>
export type LeaveRequestForm = z.infer<typeof leaveRequestSchema>
export type OvertimeRequestForm = z.infer<typeof overtimeRequestSchema>
export type TravelRequestForm = z.infer<typeof travelRequestSchema>
