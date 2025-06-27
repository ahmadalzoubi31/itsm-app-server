export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const STATUSES = [
  { value: StatusEnum.ACTIVE, label: 'Active' },
  { value: StatusEnum.INACTIVE, label: 'Inactive' },
  { value: StatusEnum.PENDING, label: 'Pending' },
  { value: StatusEnum.APPROVED, label: 'Approved' },
  { value: StatusEnum.REJECTED, label: 'Rejected' },
] as const;
