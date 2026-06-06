/** Sign-in entry points shown on the login screen (provider wiring comes later). */
export type SignInMode = 'application' | 'ad' | 'bc365'

export interface SignInModeOption {
  id: SignInMode
  label: string
  description: string
}

export const signInModeOptions: SignInModeOption[] = [
  {
    id: 'application',
    label: 'Sign in as Application User',
    description: 'Portal account (staff number and password)',
  },
  {
    id: 'ad',
    label: 'Sign in as AD (Active Directory) User',
    description: 'Central server — OpenLDAP / Active Directory',
  },
  {
    id: 'bc365',
    label: 'Sign in as BC365 User',
    description: 'Microsoft Dynamics 365 Business Central',
  },
]
