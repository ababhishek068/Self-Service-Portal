/**
 * Extended employee profile sections aligned with the HR UAT test cases:
 * job details, important dates, next of kin, employment history,
 * qualifications, assigned assets, and contract details.
 */
export interface NextOfKin {
  name: string
  relationship: string
  phone: string
  address: string
}

export interface EmploymentRecord {
  organisation: string
  position: string
  fromDate: string
  toDate: string
  type: 'Internal' | 'External'
}

export interface Qualification {
  title: string
  institution: string
  year: string
  level: string
}

export interface AssignedAsset {
  tagNumber: string
  description: string
  assignedDate: string
  status: string
}

export interface EmployeeProfileDetails {
  sector: string
  division: string
  district: string
  maritalStatus: string
  employmentType: string
  gender: string
  phoneNumber: string
  dateOfJoin: string
  contractStartDate: string
  contractEndDate: string
  probationEndDate: string
  nextOfKin: NextOfKin[]
  employmentHistory: EmploymentRecord[]
  qualifications: Qualification[]
  assignedAssets: AssignedAsset[]
}

export const defaultProfileDetails: EmployeeProfileDetails = {
  sector: 'Operations',
  division: 'Corporate Banking',
  district: 'Addis Ababa',
  maritalStatus: 'Single',
  employmentType: 'Permanent',
  gender: 'Male',
  phoneNumber: '',
  dateOfJoin: '2022-03-15',
  contractStartDate: '2022-03-15',
  contractEndDate: '2027-03-14',
  probationEndDate: '2022-09-14',
  nextOfKin: [
    { name: 'Next of Kin 1', relationship: 'Spouse', phone: '+251-9XX-XXX-XXX', address: 'Addis Ababa' },
  ],
  employmentHistory: [
    { organisation: 'Current Organisation', position: 'Senior Operations Officer', fromDate: '2022-03-15', toDate: 'Present', type: 'Internal' },
  ],
  qualifications: [
    { title: 'Bachelor of Business Administration', institution: 'Addis Ababa University', year: '2020', level: 'Degree' },
  ],
  assignedAssets: [
    { tagNumber: 'FA/BO/IT/LAP/0001/2024', description: 'Laptop — Dell Latitude', assignedDate: '2024-01-10', status: 'Active' },
  ],
}
