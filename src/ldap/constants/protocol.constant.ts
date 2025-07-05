export enum ProtocolEnum {
  LDAP = 'LDAP',
  LDAPS = 'LDAPS',
}

export const PROTOCOLS = [
  { value: ProtocolEnum.LDAP, label: 'LDAP' },
  { value: ProtocolEnum.LDAPS, label: 'LDAPS' },
] as const;
