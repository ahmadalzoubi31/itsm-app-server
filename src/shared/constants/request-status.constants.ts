export enum RequestStatus {
  SUBMITTED = 'Submitted',
  WAITING_APPROVAL = 'WaitingApproval',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'InProgress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export const REQUEST_STATUS_OPTIONS = [
  { value: RequestStatus.SUBMITTED, label: 'Submitted' },
  { value: RequestStatus.WAITING_APPROVAL, label: 'Waiting Approval' },
  { value: RequestStatus.ASSIGNED, label: 'Assigned' },
  { value: RequestStatus.IN_PROGRESS, label: 'In Progress' },
  { value: RequestStatus.RESOLVED, label: 'Resolved' },
  { value: RequestStatus.CLOSED, label: 'Closed' },
];

export const REQUEST_STATUS_VALUES = Object.values(RequestStatus);
