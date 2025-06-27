export enum UrgencyEnum {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const URGENCIES = [
  { value: UrgencyEnum.CRITICAL, label: 'Critical' },
  { value: UrgencyEnum.HIGH, label: 'High' },
  { value: UrgencyEnum.MEDIUM, label: 'Medium' },
  { value: UrgencyEnum.LOW, label: 'Low' },
];
