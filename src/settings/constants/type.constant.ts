import { ProtocolEnum } from '../../ldap/constants/protocol.constant';
import { SearchScopeEnum } from '../../ldap/constants/search-scope.constant';
import { FrequencyEnum } from '../../ldap/constants/frequency.constant';

export enum SettingTypeEnum {
  SYSTEM = 'SYSTEM',
  LDAP = 'LDAP',
  SYNC = 'SYNC',
  SECURITY = 'SECURITY',
  EMAIL = 'EMAIL',
  EMAIL_PROVIDER = 'EMAIL_PROVIDER',
  EMAIL_NOTIFICATIONS = 'EMAIL_NOTIFICATIONS',
  EMAIL_INCOMING = 'EMAIL_INCOMING',
  NOTIFICATION = 'NOTIFICATION',
  APPEARANCE = 'APPEARANCE',
}

export const SETTING_TYPES = [
  { value: SettingTypeEnum.SYSTEM, label: 'System' },
  { value: SettingTypeEnum.LDAP, label: 'LDAP' },
  { value: SettingTypeEnum.SYNC, label: 'Sync' },
  { value: SettingTypeEnum.SECURITY, label: 'Security' },
  { value: SettingTypeEnum.EMAIL, label: 'Email' },
  { value: SettingTypeEnum.EMAIL_PROVIDER, label: 'Email Provider' },
  { value: SettingTypeEnum.EMAIL_NOTIFICATIONS, label: 'Email Notifications' },
  { value: SettingTypeEnum.EMAIL_INCOMING, label: 'Email Incoming' },
  { value: SettingTypeEnum.NOTIFICATION, label: 'Notification' },
  { value: SettingTypeEnum.APPEARANCE, label: 'Appearance' },
] as const;

export const DEFAULT_LDAP_SETTINGS = {
  server: '',
  port: 389,
  protocol: ProtocolEnum.LDAP,
  searchBase: '',
  bindDn: '',
  bindPassword: '',
  searchScope: SearchScopeEnum.SUB,
  searchFilter: '(objectClass=user)',
  attributes:
    'cn,mail,displayName,givenName,sn,userPrincipalName,department,title,mobile,sAMAccountName,distinguishedName',
  useSSL: false,
  validateCert: true,
};

export const DEFAULT_SYNC_SETTINGS = {
  enabled: false,
  frequency: FrequencyEnum.DAILY,
  syncTime: '02:00',
  timezone: 'UTC',
  retryAttempts: 3,
  retryInterval: 30,
  fullSyncInterval: 7,
};
