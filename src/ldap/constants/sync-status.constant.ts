export enum SyncStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  IN_PROGRESS = 'IN_PROGRESS',
}

export const SYNC_STATUSES = [
  { value: SyncStatusEnum.SUCCESS, label: 'Success' },
  { value: SyncStatusEnum.ERROR, label: 'Error' },
  { value: SyncStatusEnum.IN_PROGRESS, label: 'In Progress' },
] as const;
