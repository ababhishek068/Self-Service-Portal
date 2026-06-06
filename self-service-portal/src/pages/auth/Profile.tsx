import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmployeeProfileDetails } from '@/api/endpoints/profile'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortalFormCard } from '@/components/shared/PortalFormCard'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  defaultProfileDetails,
  type AssignedAsset,
  type EmploymentRecord,
  type NextOfKin,
  type Qualification,
} from '@/data/employeeProfile'
import { formatDate } from '@/utils/formatters'

type ProfileTab = 'personal' | 'job' | 'dates' | 'kin' | 'history' | 'qualifications' | 'assets' | 'contract'

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: 'personal', label: 'Personal' },
  { id: 'job', label: 'Job Details' },
  { id: 'dates', label: 'Important Dates' },
  { id: 'kin', label: 'Next of Kin' },
  { id: 'history', label: 'Employment History' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'assets', label: 'Assigned Assets' },
  { id: 'contract', label: 'Contract' },
]

export function Profile() {
  const { employee } = useAuth()
  const { roleLabels: userRoleLabels } = usePermissions()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')
  const profileQuery = useQuery({ queryKey: ['profile', 'details'], queryFn: getEmployeeProfileDetails })
  const profile = profileQuery.data ?? defaultProfileDetails

  const kinColumns: DataTableColumn<NextOfKin>[] = [
    { id: 'name', header: 'Name', cell: (row) => row.name },
    { id: 'relationship', header: 'Relationship', cell: (row) => row.relationship },
    { id: 'phone', header: 'Phone', cell: (row) => row.phone },
    { id: 'address', header: 'Address', cell: (row) => row.address },
  ]

  const historyColumns: DataTableColumn<EmploymentRecord>[] = [
    { id: 'org', header: 'Organisation', cell: (row) => row.organisation },
    { id: 'position', header: 'Position', cell: (row) => row.position },
    { id: 'from', header: 'From', cell: (row) => formatDate(row.fromDate) },
    { id: 'to', header: 'To', cell: (row) => row.toDate },
    { id: 'type', header: 'Type', cell: (row) => row.type },
  ]

  const qualColumns: DataTableColumn<Qualification>[] = [
    { id: 'title', header: 'Title', cell: (row) => row.title },
    { id: 'institution', header: 'Institution', cell: (row) => row.institution },
    { id: 'year', header: 'Year', cell: (row) => row.year },
    { id: 'level', header: 'Level', cell: (row) => row.level },
  ]

  const assetColumns: DataTableColumn<AssignedAsset>[] = [
    { id: 'tag', header: 'Tag Number', cell: (row) => row.tagNumber },
    { id: 'desc', header: 'Description', cell: (row) => row.description },
    { id: 'assigned', header: 'Assigned Date', cell: (row) => formatDate(row.assignedDate) },
    { id: 'status', header: 'Status', cell: (row) => row.status },
  ]

  const readOnlyField = (label: string, value: string) => (
    <div className="space-y-1.5" key={label}>
      <Label>{label}</Label>
      <Input readOnly value={value} />
    </div>
  )

  return (
    <PageWrapper title="Employee Profile" showPageHeading={false}>
      <PortalFormCard title="Employee Profile">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portal Access</span>
          {userRoleLabels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-[var(--portal-navy)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--portal-navy)]"
            >
              {label}
            </span>
          ))}
        </div>
        {profileQuery.isLoading ? (
          <div className="mb-4 rounded border-l-4 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Loading profile details...
          </div>
        ) : null}
        <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                activeTab === tab.id
                  ? 'bg-[var(--portal-navy)] text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'personal' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {readOnlyField('Employee No.', employee?.employeeNo ?? '')}
            {readOnlyField('Full Name', employee?.displayName ?? '')}
            {readOnlyField('Gender', employee?.gender || profile.gender)}
            {readOnlyField('Marital Status', profile.maritalStatus)}
            {readOnlyField('Phone Number', employee?.phoneNumber || profile.phoneNumber || '—')}
            {readOnlyField('Email', employee?.email || '—')}
          </div>
        ) : null}

        {activeTab === 'job' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {readOnlyField('Job Title', employee?.jobTitle ?? '')}
            {readOnlyField('Job Grade', employee?.jobGrade ?? '')}
            {readOnlyField('Department', employee?.departmentName ?? '')}
            {readOnlyField('Sector', profile.sector)}
            {readOnlyField('Division', profile.division)}
            {readOnlyField('District', profile.district)}
            {readOnlyField('Branch', employee?.branchName ?? '')}
            {readOnlyField('Place of Duty', employee?.placeOfDuty ?? '')}
            {readOnlyField('Employment Type', profile.employmentType)}
            {readOnlyField('Responsible Center', employee?.responsibleCenter ?? '')}
          </div>
        ) : null}

        {activeTab === 'dates' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {readOnlyField('Date of Join', formatDate(profile.dateOfJoin))}
            {readOnlyField('Probation End Date', formatDate(profile.probationEndDate))}
          </div>
        ) : null}

        {activeTab === 'kin' ? (
          <DataTable rows={profile.nextOfKin} columns={kinColumns} getRowId={(row) => row.name} compact />
        ) : null}

        {activeTab === 'history' ? (
          <DataTable rows={profile.employmentHistory} columns={historyColumns} getRowId={(row) => `${row.organisation}-${row.fromDate}`} compact />
        ) : null}

        {activeTab === 'qualifications' ? (
          <DataTable rows={profile.qualifications} columns={qualColumns} getRowId={(row) => row.title} compact />
        ) : null}

        {activeTab === 'assets' ? (
          <DataTable rows={profile.assignedAssets} columns={assetColumns} getRowId={(row) => row.tagNumber} compact />
        ) : null}

        {activeTab === 'contract' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {readOnlyField('Contract Start Date', formatDate(profile.contractStartDate))}
            {readOnlyField('Contract End Date', formatDate(profile.contractEndDate))}
            {readOnlyField('Employment Type', profile.employmentType)}
          </div>
        ) : null}
      </PortalFormCard>
    </PageWrapper>
  )
}
