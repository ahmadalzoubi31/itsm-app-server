export enum SyncStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
}

export const SYNC_STATUSES = [
  { value: SyncStatusEnum.SUCCESS, label: 'Success' },
  { value: SyncStatusEnum.ERROR, label: 'Error' },
  { value: SyncStatusEnum.IN_PROGRESS, label: 'In Progress' },
  { value: SyncStatusEnum.CANCELLED, label: 'Cancelled' },
] as const;
