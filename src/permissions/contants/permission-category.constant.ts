export enum PermissionCategoryEnum {
  FOUNDATION = 'FOUNDATION',
  SETTINGS = 'SETTINGS',
  INCIDENT = 'INCIDENT',
}

export const PERMISSION_CATEGORIES = [
  { value: PermissionCategoryEnum.FOUNDATION, label: 'Foundation' },
  { value: PermissionCategoryEnum.SETTINGS, label: 'Settings' },
  { value: PermissionCategoryEnum.INCIDENT, label: 'Incident' },
] as const;
