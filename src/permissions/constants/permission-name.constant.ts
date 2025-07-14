export enum PermissionNameEnum {
  // Incident
  INCIDENT_MASTER = 'INCIDENT_MASTER',
  INCIDENT_USER = 'INCIDENT_USER',
  INCIDENT_SUBMITTER = 'INCIDENT_SUBMITTER',
  INCIDENT_VIEWER = 'INCIDENT_VIEWER',

  // Foundation
  Foundation_SupportGroups = 'FOUNDATION_SUPPORT_GROUP',
  Foundation_People = 'FOUNDATION_PEOPLE',
  Foundation_Category = 'FOUNDATION_CATEGORY',

  // System Settings
  System_Settings = 'SYSTEM_SETTINGS',
}

export const PERMISSION_NAMES = [
  { value: PermissionNameEnum.INCIDENT_MASTER, label: 'Incident Master' },
  { value: PermissionNameEnum.INCIDENT_USER, label: 'Incident User' },
  { value: PermissionNameEnum.INCIDENT_SUBMITTER, label: 'Incident Submitter' },
  { value: PermissionNameEnum.INCIDENT_VIEWER, label: 'Incident Viewer' },
  {
    value: PermissionNameEnum.Foundation_SupportGroups,
    label: 'Foundation Support Group',
  },
  { value: PermissionNameEnum.Foundation_People, label: 'Foundation People' },
  {
    value: PermissionNameEnum.Foundation_Category,
    label: 'Foundation Category',
  },
  { value: PermissionNameEnum.System_Settings, label: 'System Settings' },
] as const;
