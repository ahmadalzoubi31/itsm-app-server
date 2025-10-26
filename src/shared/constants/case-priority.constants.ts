export enum CasePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export const CASE_PRIORITY_OPTIONS = [
  { value: CasePriority.LOW, label: 'Low' },
  { value: CasePriority.MEDIUM, label: 'Medium' },
  { value: CasePriority.HIGH, label: 'High' },
  { value: CasePriority.CRITICAL, label: 'Critical' },
];

export const CASE_PRIORITY_VALUES = Object.values(CasePriority);
