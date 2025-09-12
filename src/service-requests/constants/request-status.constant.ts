export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export const REQUEST_STATUS = [
  { value: RequestStatus.PENDING, label: 'Pending' },
  { value: RequestStatus.APPROVED, label: 'Approved' },
  { value: RequestStatus.IN_PROGRESS, label: 'In Progress' },
  { value: RequestStatus.COMPLETED, label: 'Completed' },
  { value: RequestStatus.REJECTED, label: 'Rejected' },
  { value: RequestStatus.CANCELLED, label: 'Cancelled' },
] as const;
