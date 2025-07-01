export enum SettingTypeEnum {
  SYSTEM = 'SYSTEM',
  LDAP = 'LDAP',
  SYNC = 'SYNC',
  SECURITY = 'SECURITY',
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  APPEARANCE = 'APPEARANCE',
}

export const SETTING_TYPES = [
  { value: SettingTypeEnum.SYSTEM, label: 'System' },
  { value: SettingTypeEnum.LDAP, label: 'LDAP' },
  { value: SettingTypeEnum.SYNC, label: 'Sync' },
  { value: SettingTypeEnum.SECURITY, label: 'Security' },
  { value: SettingTypeEnum.EMAIL, label: 'Email' },
  { value: SettingTypeEnum.NOTIFICATION, label: 'Notification' },
  { value: SettingTypeEnum.APPEARANCE, label: 'Appearance' },
] as const;
