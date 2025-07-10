export enum StagedUserStatusEnum {
  NEW = 'NEW',
  UPDATED = 'UPDATED',
  IMPORTED = 'IMPORTED',
  DISABLED = 'DISABLED',
  REJECTED = 'REJECTED',
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
    value: StagedUserStatusEnum.IMPORTED,
    label: 'Imported',
    description: 'Use IMPORTED if found and not changed.',
  },
  {
    value: StagedUserStatusEnum.DISABLED,
    label: 'Disabled',
    description: 'Use DISABLED if in DB but not in latest LDAP sync.',
  },
  {
    value: StagedUserStatusEnum.REJECTED,
    label: 'Rejected',
    description: 'Use REJECTED if manually rejected.',
  },
] as const;
