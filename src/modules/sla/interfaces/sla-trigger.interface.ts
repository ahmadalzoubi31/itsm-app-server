// src/modules/sla/interfaces/sla-trigger.interface.ts

import { SlaCondition } from './sla-condition.interface';

export interface SlaTrigger {
  event: string; // e.g., "case.created", "case.status.changed", "case.assigned"
  conditions?: SlaCondition[]; // Optional conditions to match
  action: 'start' | 'stop' | 'pause' | 'resume';
}
