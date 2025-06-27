import { ImpactEnum } from './impact.constant';
import { UrgencyEnum } from './urgency.constant';

export enum PriorityEnum {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const PRIORITY_MATRIX = [
  {
    impact: ImpactEnum.CRITICAL,
    urgency: UrgencyEnum.CRITICAL,
    priority: PriorityEnum.CRITICAL,
  },
  {
    impact: ImpactEnum.CRITICAL,
    urgency: UrgencyEnum.HIGH,
    priority: PriorityEnum.CRITICAL,
  },
  {
    impact: ImpactEnum.CRITICAL,
    urgency: UrgencyEnum.MEDIUM,
    priority: PriorityEnum.HIGH,
  },
  {
    impact: ImpactEnum.CRITICAL,
    urgency: UrgencyEnum.LOW,
    priority: PriorityEnum.MEDIUM,
  },

  {
    impact: ImpactEnum.HIGH,
    urgency: UrgencyEnum.CRITICAL,
    priority: PriorityEnum.CRITICAL,
  },
  {
    impact: ImpactEnum.HIGH,
    urgency: UrgencyEnum.HIGH,
    priority: PriorityEnum.HIGH,
  },
  {
    impact: ImpactEnum.HIGH,
    urgency: UrgencyEnum.MEDIUM,
    priority: PriorityEnum.MEDIUM,
  },
  {
    impact: ImpactEnum.HIGH,
    urgency: UrgencyEnum.LOW,
    priority: PriorityEnum.LOW,
  },

  {
    impact: ImpactEnum.MEDIUM,
    urgency: UrgencyEnum.CRITICAL,
    priority: PriorityEnum.HIGH,
  },
  {
    impact: ImpactEnum.MEDIUM,
    urgency: UrgencyEnum.HIGH,
    priority: PriorityEnum.MEDIUM,
  },
  {
    impact: ImpactEnum.MEDIUM,
    urgency: UrgencyEnum.MEDIUM,
    priority: PriorityEnum.MEDIUM,
  },
  {
    impact: ImpactEnum.MEDIUM,
    urgency: UrgencyEnum.LOW,
    priority: PriorityEnum.LOW,
  },

  {
    impact: ImpactEnum.LOW,
    urgency: UrgencyEnum.CRITICAL,
    priority: PriorityEnum.MEDIUM,
  },
  {
    impact: ImpactEnum.LOW,
    urgency: UrgencyEnum.HIGH,
    priority: PriorityEnum.LOW,
  },
  {
    impact: ImpactEnum.LOW,
    urgency: UrgencyEnum.MEDIUM,
    priority: PriorityEnum.LOW,
  },
  {
    impact: ImpactEnum.LOW,
    urgency: UrgencyEnum.LOW,
    priority: PriorityEnum.LOW,
  },
] as const;
