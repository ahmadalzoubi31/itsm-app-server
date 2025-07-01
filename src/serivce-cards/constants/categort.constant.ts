export enum ServiceCardCategoryEnum {
  IT = 'IT',
  FINANCE = 'FINANCE',
  HR = 'HR',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

export const SERVICE_CARD_CATEGORIES = [
  { value: ServiceCardCategoryEnum.IT, label: 'IT' },
  { value: ServiceCardCategoryEnum.FINANCE, label: 'Finance' },
  { value: ServiceCardCategoryEnum.HR, label: 'HR' },
  { value: ServiceCardCategoryEnum.LEGAL, label: 'Legal' },
  { value: ServiceCardCategoryEnum.OTHER, label: 'Other' },
] as const;
