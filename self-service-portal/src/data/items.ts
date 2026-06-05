/**
 * Sample item master used by store/purchase requisition forms during
 * development. Replace with the BC `items` OData feed in production.
 */
export const itemMaster = [
  { code: 'ST032', description: 'Photocopy paper', uom: 'Pcs', stock: 480, unitPrice: 180, categoryCode: 'ST', isFixedAsset: false },
  { code: 'ST067', description: 'Kyocera toner cartridge', uom: 'Pcs', stock: 42, unitPrice: 3900, categoryCode: 'ST', isFixedAsset: false },
  { code: 'FA112', description: 'Laptop computer', uom: 'Pcs', stock: 11, unitPrice: 68000, categoryCode: 'IT', isFixedAsset: true },
  { code: 'FA220', description: 'Office chair', uom: 'Pcs', stock: 33, unitPrice: 9800, categoryCode: 'FF', isFixedAsset: true },
  { code: 'SRV210', description: 'Generator maintenance service', uom: 'Job', stock: 999, unitPrice: 12500, categoryCode: 'SRV', isFixedAsset: false },
] as const

export type ItemMasterRow = (typeof itemMaster)[number]
