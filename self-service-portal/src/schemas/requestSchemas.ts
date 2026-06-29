import { differenceInCalendarDays, isBefore, isSameDay, parseISO } from 'date-fns'
import { z } from 'zod'
import { isErpWorkingDate } from '@/utils/validators'

const today = () => new Date()
const isValidDateString = (value: string) => {
  const parsed = parseISO(value)
  return !Number.isNaN(parsed.getTime())
}

const dateField = z.string().min(1, 'Date is required').refine(isValidDateString, 'Use a valid date')
const workingDateField = dateField.refine(
  (value) => isErpWorkingDate(value),
  'Date must equal the ERP working date (no backdating or future-dating)',
)
const faTagPattern = /^FA\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9]+\/\d{3,5}\/\d{4}$/
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
  description: z.string().optional(),
  contentBase64: z.string().optional(),
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
    if (!isErpWorkingDate(data.startDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Start date must equal the ERP working date',
      })
    }
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
    claimDate: workingDateField,
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

// --- ESS multi-step (header + line) schemas ---------------------------------

export const staffClaimHeaderSchema = z.object({
  claimDate: workingDateField,
  purpose: z.string().min(3, 'Claim purpose is required'),
})

export const staffClaimLineSchema = z.object({
  claimType: z.string().min(1, 'Claim type is required'),
  accountNo: z.string().min(1, 'Account number is required'),
  accountName: optionalText,
  hospitalCategory: optionalText,
  medicalAmount: z.coerce.number().min(0).default(0),
  amount: moneyField,
  claimReceiptNo: optionalText,
  expenditureDate: dateField,
  expenditureDescription: z.string().min(3, 'Expenditure description is required'),
})

export const imprestHeaderSchema = z
  .object({
    dateRequired: workingDateField,
    purpose: z.string().min(3, 'Imprest purpose is required'),
    travelDate: dateField,
    returnDate: dateField,
  })
  .superRefine((data, ctx) => {
    if (isBefore(parseISO(data.returnDate), parseISO(data.travelDate))) {
      ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return date must be on or after the start date' })
    }
  })

export const imprestLineHeaderSchema = z.object({
  advanceType: z.string().min(1, 'Imprest type is required'),
  destination: z.string().min(1, 'Travel destination is required'),
  dutyArea: z.string().min(1, 'Duty area is required'),
  noOfDays: z.coerce.number().positive('No. of days is required'),
  amount: moneyField,
})

export const pettyCashHeaderSchema = z.object({
  dateNeeded: workingDateField,
  description: z.string().min(3, 'Petty cash description & reason is required'),
})

export const pettyCashLineSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  name: optionalText,
  amount: moneyField,
})

export const imprestSurrenderHeaderSchema = z.object({
  imprest: z.string().min(1, 'Select the imprest to surrender'),
})

export const storeHeaderSchema = z.object({
  dateRequired: workingDateField,
  description: z.string().min(3, 'Request description is required'),
})

export const storeLineSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  issuingStore: z.string().min(1, 'Issuing store is required'),
  itemNo: z.string().min(1, 'Item number is required'),
  description: optionalText,
  quantity: quantityField,
})

export const transportHeaderSchema = z.object({
  requestType: z.string().min(1, 'Request type is required'),
  destination: z.string().min(1, 'Destination is required'),
  dateOfTrip: dateField,
  responsibilityCenter: z.string().min(1, 'Responsibility center is required'),
  noOfDays: z.coerce.number().positive('No. of days is required'),
  noOfPassengers: z.coerce.number().positive('No. of passengers is required'),
  purpose: z.string().min(3, 'Purpose of the trip is required'),
})

export const transportPassengerLineSchema = z.object({
  passengerType: z.string().min(1, 'Passenger type is required'),
  employeeNo: optionalText,
  externalPassName: optionalText,
  externalPassOrganization: optionalText,
}).superRefine((data, ctx) => {
  if (data.passengerType === 'Staff' && !data.employeeNo) {
    ctx.addIssue({ code: 'custom', path: ['employeeNo'], message: 'Employee is required' })
  }
  if (data.passengerType === 'External' && !data.externalPassName) {
    ctx.addIssue({ code: 'custom', path: ['externalPassName'], message: 'Passenger name is required' })
  }
})

export const purchaseHeaderSchema = z.object({
  dateNeeded: workingDateField,
  description: z.string().min(3, 'Description is required'),
})

export const purchaseLineSchema = z.object({
  itemNo: z.string().min(1, 'Item number is required'),
  location: optionalText,
  reasonForRequest: z.string().min(3, 'Reason for request is required'),
  quantity: quantityField,
  type: z.string().min(1, 'Type is required'),
})

export const transferOrderHeaderSchema = z
  .object({
    from: z.string().min(1, 'From location is required'),
    to: z.string().min(1, 'To location is required'),
    inTransit: z.string().min(1, 'In-transit code is required'),
    truckNo: z.string().min(1, 'Truck number is required'),
    postingDate: dateField,
    driverName: z.string().min(1, 'Driver name is required'),
  })
  .refine((data) => data.from !== data.to, {
    path: ['to'],
    message: 'Destination must be different from the source location',
  })

export const transferOrderLineSchema = z.object({
  itemNo: z.string().min(1, 'Item number is required'),
  quantity: quantityField,
})

export const pettyCashSchema = z.object({
  activity: z.enum(['Request', 'Petty Cash Replenishment', 'Petty Cash Settlement']),
  departmentCode: z.string().min(1, 'Department is required'),
  requestDate: workingDateField,
  amount: moneyField,
  limitAmount: moneyField,
  costCenter: z.string().min(2, 'Cost center is required'),
  purpose: z.string().min(8, 'Purpose is required'),
  attachments: z.array(attachmentSchema).default([]),
})

export const pettyCashReplenishmentSchema = z.object({
  dateCreated: workingDateField,
  sector: z.string().min(1, 'Sector is required'),
  division: z.string().min(1, 'Division is required'),
  department: z.string().min(1, 'Department is required'),
  payingAccount: z.string().min(2, 'Paying account is required'),
  sourceAmount: moneyField,
  receivingAccount: z.string().min(2, 'Receiving account is required'),
  receivingAmount: moneyField,
  remarks: z.string().min(5, 'Remarks are required'),
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
    if (data.isFixedAsset && !faTagPattern.test(data.faTagNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['faTagNumber'],
        message: 'FA Tag must follow FA/{dept}/{category}/{item}/{seq}/{year}',
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

/** ESS fuel requisition card — `FuelMaintenanceController`. */
export const fuelHeaderSchema = z
  .object({
    requestType: z.string().min(1, 'Request type is required'),
    cardNo: optionalText,
    vehicleNo: optionalText,
    fuelDealer: optionalText,
    quantity: z.coerce.number().min(0).default(0),
    price: z.coerce.number().min(0).default(0),
    purpose: z.string().min(3, 'Purpose is required'),
  })
  .superRefine((data, ctx) => {
    const isCard = data.requestType === '3' || data.requestType.toLowerCase().includes('card')
    if (isCard && !data.cardNo) {
      ctx.addIssue({ code: 'custom', path: ['cardNo'], message: 'Fuel card number is required' })
    }
    if (!isCard && !data.vehicleNo) {
      ctx.addIssue({ code: 'custom', path: ['vehicleNo'], message: 'Vehicle registration number is required' })
    }
    if (!isCard && !data.fuelDealer) {
      ctx.addIssue({ code: 'custom', path: ['fuelDealer'], message: 'Fuel dealer is required' })
    }
  })

export const trainingRequestSchema = z.object({
  trainingNeed: z.string().min(1, 'Training course is required'),
  comments: z.string().min(3, 'Comments are required'),
})

export const transportRequestSchema = z
  .object({
    transportType: z.enum(['City', 'Field']),
    tripDate: dateField,
    tripTime: z.string().min(1, 'Trip time is required'),
    destination: z.string().min(2, 'Destination is required'),
    passengers: z
      .array(
        z.object({
          name: z.string().min(2, 'Passenger name is required'),
          passengerType: z.enum(['Internal', 'External']),
        }),
      )
      .min(1, 'Add at least one passenger'),
    purpose: z.string().min(8, 'Purpose is required'),
  })
  .refine((data) => !isBefore(parseISO(data.tripDate), today()), {
    path: ['tripDate'],
    message: 'Trip date cannot be backdated',
  })

export const salaryAdvanceSchema = z.object({
  purpose: z.string().min(8, 'Purpose is required'),
  percentageSalary: z.coerce.number().positive('Percentage is required').max(100, 'Maximum is 100%'),
})

export const trainingNeedsSchema = z.object({
  trainingTitle: z.string().min(3, 'Training title is required'),
  trainingPeriod: z.string().min(3, 'Training period is required'),
  provider: z.string().min(2, 'Provider is required'),
  estimatedCost: z.coerce.number().min(0).optional().default(0),
  justification: z.string().min(10, 'Justification is required'),
  groupName: optionalText,
})

export const documentRequisitionSchema = z.object({
  documentType: z.string().min(2, 'Document type is required'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
})

export const maintenanceRequestSchema = z
  .object({
    requestDate: dateField,
    requestType: z.enum(['1', '2']),
    faTagNumber: optionalText,
    vehicleNo: optionalText,
    item: z.string().min(2, 'Item / service is required'),
    quantity: quantityField,
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    location: z.string().min(2, 'Location is required'),
    odometer: z.coerce.number().min(0).default(0),
    lastServiceOdometer: z.coerce.number().min(0).default(0),
    issueDescription: z.string().min(10, 'Issue description is required'),
    attachments: z.array(attachmentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.requestType === '1' && !data.faTagNumber) {
      ctx.addIssue({ code: 'custom', path: ['faTagNumber'], message: 'FA tag number is required' })
    }
    if (data.requestType === '2') {
      if (!data.vehicleNo) {
        ctx.addIssue({ code: 'custom', path: ['vehicleNo'], message: 'Vehicle number is required' })
      }
      if (data.odometer <= 0) {
        ctx.addIssue({ code: 'custom', path: ['odometer'], message: 'Current odometer is required' })
      }
      if (data.lastServiceOdometer > 0 && data.odometer - data.lastServiceOdometer < 5000) {
        ctx.addIssue({
          code: 'custom',
          path: ['odometer'],
          message: `Vehicle service is due at ${data.lastServiceOdometer + 5000} km`,
        })
      }
    }
  })

export const transferOrderSchema = z
  .object({
    from: z.string().min(2, 'From location is required'),
    to: z.string().min(2, 'To location is required'),
    inTransit: z.string().min(2, 'In-transit location is required'),
    truckNo: optionalText,
    driverName: optionalText,
    postingDate: dateField,
    lines: z.array(z.object({
      itemNo: z.string().min(1, 'Item is required'),
      quantity: quantityField,
    })).min(1, 'Add at least one transfer line'),
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

export const vehicleTransferSchema = z.object({
  vehicleNo: z.string().min(2, 'Vehicle number is required'),
  fromDriver: z.string().min(2, 'Current driver is required'),
  toDriver: z.string().min(2, 'Receiving driver is required'),
  transferDate: dateField,
  odometer: z.coerce.number().positive('Odometer reading is required'),
  reason: z.string().min(8, 'Reason is required'),
  attachments: z.array(attachmentSchema).default([]),
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
  pettyCashReplenishment: pettyCashReplenishmentSchema,
  storeRequisition: storeRequisitionSchema,
  purchaseRequisition: purchaseRequisitionSchema,
  fuelRequest: fuelRequestSchema,
  transport: transportRequestSchema,
  maintenance: maintenanceRequestSchema,
  transferOrder: transferOrderSchema,
  vehicleTransfer: vehicleTransferSchema,
  gatePass: gatePassSchema,
  leave: leaveRequestSchema,
  overtime: overtimeRequestSchema,
  travel: travelRequestSchema,
  trainingNeeds: trainingNeedsSchema,
  salaryAdvance: salaryAdvanceSchema,
  documentRequisition: documentRequisitionSchema,
}

export type ImprestRequestForm = z.infer<typeof imprestRequestSchema>
export type ImprestSurrenderForm = z.infer<typeof imprestSurrenderSchema>
export type StaffClaimForm = z.infer<typeof staffClaimSchema>
export type PettyCashForm = z.infer<typeof pettyCashSchema>
export type PettyCashReplenishmentForm = z.infer<typeof pettyCashReplenishmentSchema>
export type StoreRequisitionForm = z.infer<typeof storeRequisitionSchema>
export type PurchaseRequisitionForm = z.infer<typeof purchaseRequisitionSchema>
export type FuelRequestForm = z.infer<typeof fuelRequestSchema>
export type TransportRequestForm = z.infer<typeof transportRequestSchema>
export type MaintenanceRequestForm = z.infer<typeof maintenanceRequestSchema>
export type TransferOrderForm = z.infer<typeof transferOrderSchema>
export type VehicleTransferForm = z.infer<typeof vehicleTransferSchema>
export type GatePassForm = z.infer<typeof gatePassSchema>
export type LeaveRequestForm = z.infer<typeof leaveRequestSchema>
export type OvertimeRequestForm = z.infer<typeof overtimeRequestSchema>
export type TravelRequestForm = z.infer<typeof travelRequestSchema>
export type TrainingNeedsForm = z.infer<typeof trainingNeedsSchema>
export type SalaryAdvanceForm = z.infer<typeof salaryAdvanceSchema>
export type DocumentRequisitionForm = z.infer<typeof documentRequisitionSchema>
