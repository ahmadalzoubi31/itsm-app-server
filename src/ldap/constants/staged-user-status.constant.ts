export enum StagedUserStatusEnum {
  NEW = 'NEW',
  UPDATED = 'UPDATED',
  EXISTING = 'EXISTING',
  DISABLED = 'DISABLED',
}

export const STAGED_USER_STATUSES = [
  {
    value: StagedUserStatusEnum.NEW,
    label: 'New',
    description: 'Use NEW if not found.',
  },
  {
    value: StagedUserStatusEnum.UPDATED,
    label: 'Updated',
    description: 'Use UPDATED if found and changed.',
  },
  {
    value: StagedUserStatusEnum.EXISTING,
    label: 'Existing',
    description: 'Use EXISTING if found and not changed.',
  },
  {
    value: StagedUserStatusEnum.DISABLED,
    label: 'Disabled',
    description: 'Use DISABLED if in DB but not in latest LDAP sync.',
  },
] as const;
