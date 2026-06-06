/**
 * Central brand configuration for the Self-Service Portal.
 *
 * Keep all company/product naming here so the brand can be changed in one
 * place rather than scattered across components.
 */
export const brand = {
  /** Full legal company name shown in headers and footers. */
  company: 'Technology Associates EA Limited',
  /** Shorter form for tight spaces. */
  companyShort: 'Technology Associates',
  /** Monogram used inside the circular logo badge. */
  monogram: 'TA',
  /** Product name. */
  product: 'Self Service Portal',
  /** Product name without the "Portal" suffix (used in the sidebar). */
  productShort: 'Self Service',
} as const
