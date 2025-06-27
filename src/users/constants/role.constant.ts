export enum RoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AGENT = 'AGENT',
}

export const ROLES = [
  { value: RoleEnum.ADMIN, label: 'Admin' },
  { value: RoleEnum.AGENT, label: 'Agent' },
  { value: RoleEnum.USER, label: 'User' },
] as const;
