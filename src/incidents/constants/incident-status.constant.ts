export enum IncidentStatusEnum {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  ON_HOLD = 'ON_HOLD',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export const INCIDENT_STATUSES = [
  {
    value: IncidentStatusEnum.NEW,
    label: 'New',
  },
  {
    value: IncidentStatusEnum.ASSIGNED,
    label: 'Assigned',
  },
  {
    value: IncidentStatusEnum.ON_HOLD,
    label: 'On Hold',
  },
  {
    value: IncidentStatusEnum.IN_PROGRESS,
    label: 'In Progress',
  },
  {
    value: IncidentStatusEnum.RESOLVED,
    label: 'Resolved',
  },
  {
    value: IncidentStatusEnum.CLOSED,
    label: 'Closed',
  },
  {
    value: IncidentStatusEnum.CANCELLED,
    label: 'Cancelled',
  },
] as const;
