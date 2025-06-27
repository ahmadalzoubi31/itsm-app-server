export enum ImpactEnum {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const IMPACTS = [
  { value: ImpactEnum.CRITICAL, label: 'Critical' },
  { value: ImpactEnum.HIGH, label: 'High' },
  { value: ImpactEnum.MEDIUM, label: 'Medium' },
  { value: ImpactEnum.LOW, label: 'Low' },
];
