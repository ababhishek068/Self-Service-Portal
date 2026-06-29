import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { getPrisma, disconnect } from '../src/client.js'

/**
 * Seed demo staff accounts into the database.
 * Run with:  npm run seed   (inside the db/ folder)
 *
 * Every account uses the password below — change it before any real use.
 */
const DEMO_PASSWORD = 'Password@123'
const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10)

const seeds = [
  {
    employeeNo: 'EMP-02418',
    name: 'Admin',
    lastName: 'User',
    roles: 'staff,hod,ictAdmin,ceo',
    email: 'admin@example.com',
    department: 'BO',
    departmentName: 'Branch Operations',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Senior Operations Officer',
    jobGrade: 'G7',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459922',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 16,
    responsibleCenter: 'HO-BO',
    permissionDepartments: 'BO',
    phoneNumber: '0911000001',
    gender: 'Male',
    hod: true,
    ceo: true,
  },
  {
    employeeNo: 'EMP-01002',
    name: 'Manager',
    lastName: 'User',
    roles: 'staff,lineManager,hod',
    email: 'manager@example.com',
    department: 'FIN',
    departmentName: 'Finance',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Finance Manager',
    jobGrade: 'G8',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459923',
    managerEmployeeNo: 'EMP-02418',
    leaveBalance: 18,
    responsibleCenter: 'HO-FIN',
    permissionDepartments: 'FIN,BO',
    phoneNumber: '0911000002',
    gender: 'Female',
    hod: true,
    ceo: false,
  },
  {
    employeeNo: 'EMP-03245',
    name: 'Staff',
    lastName: 'User',
    roles: 'staff',
    email: 'staff@example.com',
    department: 'FAC',
    departmentName: 'Facility Management',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Facility Officer',
    jobGrade: 'G5',
    placeOfDuty: 'Head Office',
    accountNumber: '1000459924',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 12,
    responsibleCenter: 'HO-FAC',
    permissionDepartments: 'FAC',
    phoneNumber: '0911000003',
    gender: 'Male',
    hod: false,
    ceo: false,
  },
  {
    employeeNo: 'HB-00123',
    name: 'Abhishek',
    lastName: 'Behera',
    roles: 'staff',
    email: '',
    department: 'FIN',
    departmentName: 'Finance',
    branchCode: 'HO',
    branchName: 'Head Office',
    jobTitle: 'Finance Officer',
    jobGrade: 'G6',
    placeOfDuty: 'Head Office',
    accountNumber: '',
    managerEmployeeNo: 'EMP-01002',
    leaveBalance: 21,
    responsibleCenter: 'HO-FIN',
    permissionDepartments: 'FIN',
    phoneNumber: '',
    gender: 'Male',
    hod: false,
    ceo: false,
    password: 'Secret@123',
  },
]

const payrollLines = [
  { label: 'Basic Salary', amount: 45000, type: 'earning' },
  { label: 'Transport Allowance', amount: 3500, type: 'earning' },
  { label: 'Housing Allowance', amount: 8000, type: 'earning' },
  { label: 'Income Tax', amount: -6200, type: 'deduction' },
  { label: 'Pension (Employee 7%)', amount: -3150, type: 'deduction' },
]

const documents = [
  {
    id: 'insurance-fixed-asset-report',
    title: 'Insurance Fixed Asset Report',
    category: 'Report',
    updatedOn: '06 Nov 2025',
    fileName: 'Insurance-Fixed-Asset-Report.pdf',
    mimeType: 'application/pdf',
    content: readFileSync(
      new URL('./assets/Insurance-Fixed-Asset-Report.pdf', import.meta.url),
    ).toString('base64'),
  },
  {
    id: 'hr-policy-manual',
    title: 'HR Policy Manual',
    category: 'Policy',
    updatedOn: '12 Mar 2026',
    fileName: 'hr-policy-manual.txt',
    mimeType: 'text/plain',
    content: 'HR Policy Manual\n\nThis seeded document confirms the downloads module is backed by MySQL.',
  },
  {
    id: 'code-of-conduct',
    title: 'Code of Conduct',
    category: 'Policy',
    updatedOn: '04 Feb 2026',
    fileName: 'code-of-conduct.txt',
    mimeType: 'text/plain',
    content: 'Code of Conduct\n\nThis seeded document confirms policy downloads are served by the backend.',
  },
  {
    id: 'leave-application-form',
    title: 'Leave Application Form',
    category: 'Form',
    updatedOn: '20 Jan 2026',
    fileName: 'leave-application-form.txt',
    mimeType: 'text/plain',
    content: 'Leave Application Form\n\nUse the portal Leave Requisition screen for live submissions.',
  },
  {
    id: 'travel-claim-form',
    title: 'Travel Claim Form',
    category: 'Form',
    updatedOn: '12 Jan 2026',
    fileName: 'travel-claim-form.txt',
    mimeType: 'text/plain',
    content: 'Travel Claim Form\n\nUse Staff Claims for expense reimbursement workflows.',
  },
  {
    id: 'performance-appraisal-guidelines',
    title: 'Performance Appraisal Guidelines',
    category: 'Guideline',
    updatedOn: '02 Jan 2026',
    fileName: 'performance-appraisal-guidelines.txt',
    mimeType: 'text/plain',
    content: 'Performance Appraisal Guidelines\n\nThis document is stored in the policy_documents table.',
  },
]

function workflowMeta({ makerEmployeeNo, makerName, approverEmployeeNo, approverName, status, action }) {
  const now = new Date().toISOString()
  return {
    approvalSteps: [
      {
        id: `step-${randomUUID()}`,
        actorEmployeeNo: makerEmployeeNo,
        actorName: makerName,
        role: 'Maker',
        status: status === 'Draft' ? 'Draft' : 'Submitted',
        timestamp: now,
      },
      {
        id: `step-${randomUUID()}`,
        actorEmployeeNo: approverEmployeeNo,
        actorName: approverName,
        role: 'Checker',
        status,
        timestamp: now,
      },
    ],
    auditTrail: [
      {
        id: `audit-${randomUUID()}`,
        actorEmployeeNo: makerEmployeeNo,
        actorName: makerName,
        action,
        timestamp: now,
      },
    ],
  }
}

const sampleRequests = [
  {
    requestNo: 'IMP-SEED-0001',
    requestType: 'imprest',
    title: 'Field visit advance',
    status: 'Pending Approval',
    makerEmployeeNo: 'HB-00123',
    makerName: 'Abhishek Behera',
    departmentCode: 'FIN',
    departmentName: 'Finance',
    responsibleCenter: 'HO-FIN',
    amount: 15000,
    approverEmployeeNo: 'EMP-01002',
    approverName: 'Manager User',
    submittedAt: new Date('2026-06-02T09:00:00Z'),
    payload: { purpose: 'Client site visit', amount: 15000, activity: 'Imprest Requisition' },
    action: 'Submitted for approval',
  },
  {
    requestNo: 'LV-SEED-0001',
    requestType: 'leave',
    title: 'Annual leave',
    status: 'Approved',
    makerEmployeeNo: 'EMP-03245',
    makerName: 'Staff User',
    departmentCode: 'FAC',
    departmentName: 'Facility Management',
    responsibleCenter: 'HO-FAC',
    amount: 0,
    approverEmployeeNo: 'EMP-01002',
    approverName: 'Manager User',
    submittedAt: new Date('2026-05-15T08:00:00Z'),
    payload: {
      leaveType: 'ANNUAL',
      appliedDays: 3,
      startDate: '2026-05-20',
      endDate: '2026-05-22',
      reason: 'Family event',
    },
    action: 'Approved',
  },
  {
    requestNo: 'SR-SEED-0001',
    requestType: 'storeRequisition',
    title: 'IT consumables',
    status: 'Approved',
    makerEmployeeNo: 'EMP-03245',
    makerName: 'Staff User',
    departmentCode: 'FAC',
    departmentName: 'Facility Management',
    responsibleCenter: 'HO-FAC',
    amount: 4200,
    approverEmployeeNo: 'EMP-01002',
    approverName: 'Manager User',
    submittedAt: new Date('2026-05-10T10:00:00Z'),
    payload: {
      lines: [
        { itemCode: 'TONER-001', description: 'Printer toner cartridge', quantity: 2 },
        { itemCode: 'PAPER-A4', description: 'A4 copier paper (ream)', quantity: 5 },
      ],
    },
    action: 'Approved',
  },
  {
    requestNo: 'GP-SEED-0001',
    requestType: 'gatePass',
    title: 'Laptop exit pass',
    status: 'Approved',
    makerEmployeeNo: 'EMP-03245',
    makerName: 'Staff User',
    departmentCode: 'FAC',
    departmentName: 'Facility Management',
    responsibleCenter: 'HO-FAC',
    amount: 0,
    approverEmployeeNo: 'EMP-01002',
    approverName: 'Manager User',
    submittedAt: new Date('2026-05-18T11:30:00Z'),
    payload: {
      gatePassType: 'Asset',
      assetTagNumber: 'FA/FAC/IT/LAP/0001/2024',
      destination: 'Vendor repair centre',
      returnDate: '2026-05-25',
    },
    action: 'Approved',
  },
  {
    requestNo: 'PC-SEED-0001',
    requestType: 'pettyCash',
    title: 'Office refreshments',
    status: 'Rejected',
    makerEmployeeNo: 'HB-00123',
    makerName: 'Abhishek Behera',
    departmentCode: 'FIN',
    departmentName: 'Finance',
    responsibleCenter: 'HO-FIN',
    amount: 3500,
    approverEmployeeNo: 'EMP-01002',
    approverName: 'Manager User',
    submittedAt: new Date('2026-05-28T14:00:00Z'),
    payload: { purpose: 'Team meeting refreshments', amount: 3500, activity: 'Petty Cash Request' },
    action: 'Rejected',
  },
]

function profileFor(spec) {
  return {
    employeeNo: spec.employeeNo,
    sector: spec.departmentName || 'Operations',
    division: spec.branchName || 'Head Office',
    district: 'Addis Ababa',
    maritalStatus: 'Single',
    employmentType: 'Permanent',
    dateOfJoin: '2022-03-15',
    contractStartDate: '2022-03-15',
    contractEndDate: '2027-03-14',
    probationEndDate: '2022-09-14',
    nextOfKin: [
      { name: 'Next of Kin 1', relationship: 'Spouse', phone: '+251-9XX-XXX-XXX', address: 'Addis Ababa' },
    ],
    employmentHistory: [
      { organisation: 'Current Organisation', position: spec.jobTitle, fromDate: '2022-03-15', toDate: 'Present', type: 'Internal' },
    ],
    qualifications: [
      { title: 'Bachelor of Business Administration', institution: 'Addis Ababa University', year: '2020', level: 'Degree' },
    ],
    assignedAssets: [
      { tagNumber: `FA/${spec.department}/IT/LAP/0001/2024`, description: 'Laptop - Dell Latitude', assignedDate: '2024-01-10', status: 'Active' },
    ],
  }
}

async function run() {
  const prisma = getPrisma()
  const defaultPasswordHash = await bcrypt.hash(DEMO_PASSWORD, ROUNDS)

  for (const spec of seeds) {
    const { password: accountPassword, ...userSpec } = spec
    const passwordHash = accountPassword
      ? await bcrypt.hash(accountPassword, ROUNDS)
      : defaultPasswordHash
    const data = { ...userSpec, passwordHash, status: 'Active', mustChangePassword: false }
    await prisma.user.upsert({
      where: { employeeNo: spec.employeeNo },
      create: data,
      update: data,
    })
    console.log(`  seeded ${spec.employeeNo} (${spec.name} ${spec.lastName})`)
  }

  for (const spec of seeds) {
    const earnings = payrollLines.filter((line) => line.type === 'earning')
    const deductions = payrollLines.filter((line) => line.type === 'deduction')
    const grossPay = earnings.reduce((sum, line) => sum + line.amount, 0)
    const totalDeductions = deductions.reduce((sum, line) => sum + Math.abs(line.amount), 0)
    await prisma.payrollSlip.upsert({
      where: {
        employeeNo_year_month: {
          employeeNo: spec.employeeNo,
          year: 2026,
          month: 'March',
        },
      },
      create: {
        employeeNo: spec.employeeNo,
        employeeName: `${spec.name} ${spec.lastName}`.trim(),
        departmentCode: spec.department,
        departmentName: spec.departmentName,
        year: 2026,
        month: 'March',
        grossPay,
        totalDeductions,
        netPay: grossPay - totalDeductions,
        lines: payrollLines,
      },
      update: {
        employeeName: `${spec.name} ${spec.lastName}`.trim(),
        departmentCode: spec.department,
        departmentName: spec.departmentName,
        grossPay,
        totalDeductions,
        netPay: grossPay - totalDeductions,
        lines: payrollLines,
      },
    })

    await prisma.performanceReview.upsert({
      where: {
        employeeNo_period: {
          employeeNo: spec.employeeNo,
          period: '2026 H1',
        },
      },
      create: {
        employeeNo: spec.employeeNo,
        employeeName: `${spec.name} ${spec.lastName}`.trim(),
        period: '2026 H1',
        supervisorEmployeeNo: spec.managerEmployeeNo,
        supervisorName: seeds.find((user) => user.employeeNo === spec.managerEmployeeNo)?.name ?? '',
        departmentCode: spec.department,
        departmentName: spec.departmentName,
        status: spec.employeeNo === 'EMP-02418' ? 'Open' : 'Pending Approval',
      },
      update: {
        employeeName: `${spec.name} ${spec.lastName}`.trim(),
        supervisorEmployeeNo: spec.managerEmployeeNo,
        supervisorName: seeds.find((user) => user.employeeNo === spec.managerEmployeeNo)?.name ?? '',
        departmentCode: spec.department,
        departmentName: spec.departmentName,
        status: spec.employeeNo === 'EMP-02418' ? 'Open' : 'Pending Approval',
      },
    })

    const profile = profileFor(spec)
    await prisma.employeeProfile.upsert({
      where: { employeeNo: spec.employeeNo },
      create: profile,
      update: profile,
    })
  }

  for (const doc of documents) {
    const { id, ...data } = doc
    await prisma.policyDocument.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    })
  }

  for (const sample of sampleRequests) {
    const { action, ...request } = sample
    const workflow = workflowMeta({
      makerEmployeeNo: request.makerEmployeeNo,
      makerName: request.makerName,
      approverEmployeeNo: request.approverEmployeeNo,
      approverName: request.approverName,
      status: request.status,
      action,
    })
    await prisma.portalRequest.upsert({
      where: { requestNo: request.requestNo },
      create: {
        ...request,
        sourceDocumentNo: request.requestNo,
        sourceDocumentEntity: request.requestType,
        attachments: [],
        ...workflow,
      },
      update: {
        ...request,
        sourceDocumentNo: request.requestNo,
        sourceDocumentEntity: request.requestType,
        attachments: [],
        ...workflow,
      },
    })
  }

  console.log(`\nDone. ${seeds.length} users, ${seeds.length} profiles, ${seeds.length} payroll slips, ${seeds.length} performance reviews, ${documents.length} documents, and ${sampleRequests.length} sample requests upserted.`)
  console.log(`Default demo password: ${DEMO_PASSWORD}`)
  console.log('HB-00123 uses password: Secret@123')
}

run()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(disconnect)
