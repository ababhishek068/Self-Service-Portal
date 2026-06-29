/**
 * Option lists mirrored from the ESS reference dropdowns (Business Central
 * OData masters). The Application User backend serves these as static seed
 * values; the BC365 backend resolves the same labels through OData.
 */

export const claimTypeOptions = [
  { label: 'Medical Claim', value: 'MEDICAL' },
  { label: 'Travel Claim', value: 'TRAVEL' },
  { label: 'Other Claim', value: 'OTHER' },
]

/** ESS hospital categories: 1 = Government, 2 = Private, 3 = Online. */
export const hospitalCategoryOptions = [
  { label: 'Government', value: '1' },
  { label: 'Private', value: '2' },
  { label: 'Online', value: '3' },
]

/** Petty cash line types (ReceiptPaymentTypes G/L Account, Payment). */
export const pettyCashTypeOptions = [
  'TRANSPORT',
  'MOBILE',
  'STATIONERY',
  'REFRESHMENT',
  'POSTAGE',
  'FUEL',
  'OTHER',
].map((value) => ({ label: value, value }))

/** Imprest line advance types (ImprestType OData, Type = 'Imprest'). */
export const imprestTypeOptions = [
  'SALARY',
  'TRAVEL',
  'PER DIEM',
  'ACCOMMODATION',
  'TRANSPORT',
  'OTHER',
].map((value) => ({ label: value, value }))

/** Fuel request types: 0 = Vehicle fuel, 3 = Fuel Recharge Card. */
export const fuelRequestTypeOptions = [
  { label: 'Vehicle fuel', value: '0' },
  { label: 'Fuel Recharge Card', value: '3' },
]

/** Store / purchase line types. */
export const storeLineTypeOptions = [
  { label: 'Item', value: '1' },
  { label: 'Asset', value: '2' },
]

export const purchaseLineTypeOptions = [
  { label: 'Service', value: '1' },
  { label: 'Item', value: '2' },
  { label: 'Asset', value: '4' },
]

/** Transport request types: 0 = City, 1 = Field Trip. */
export const transportRequestTypeOptions = [
  { label: 'City', value: '0' },
  { label: 'Field Trip', value: '1' },
]

export const passengerTypeOptions = [
  { label: 'Staff', value: 'Staff' },
  { label: 'External', value: 'External' },
]
