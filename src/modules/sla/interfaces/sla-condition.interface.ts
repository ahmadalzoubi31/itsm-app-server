// src/modules/sla/interfaces/sla-condition.interface.ts

export interface SlaCondition {
  field: string; // e.g., "status", "priority", "assignedTo"
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any; // Can use $null$ prefix for null/empty/undefined values
}
