// src/modules/sla/interfaces/sla-target-rules.interface.ts

import { SlaTrigger } from './sla-trigger.interface';

export interface SlaTargetRules {
  // When to start the SLA timer
  startTriggers: SlaTrigger[];

  // When to stop/pause/resume the SLA timer
  stopTriggers: SlaTrigger[];
  pauseTriggers: SlaTrigger[];
  resumeTriggers: SlaTrigger[];
}
