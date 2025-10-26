export enum CaseStatus {
  NEW = 'New',
  WAITING_APPROVAL = 'WaitingApproval',
  IN_PROGRESS = 'InProgress',
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export const CASE_STATUS_OPTIONS = [
  { value: CaseStatus.NEW, label: 'New' },
  { value: CaseStatus.WAITING_APPROVAL, label: 'Waiting Approval' },
  { value: CaseStatus.IN_PROGRESS, label: 'In Progress' },
  { value: CaseStatus.PENDING, label: 'Pending' },
  { value: CaseStatus.RESOLVED, label: 'Resolved' },
  { value: CaseStatus.CLOSED, label: 'Closed' },
];

export const CASE_STATUS_VALUES = Object.values(CaseStatus);
