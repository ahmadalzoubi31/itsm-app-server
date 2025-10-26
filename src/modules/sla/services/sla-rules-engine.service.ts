// src/modules/sla/services/sla-rules-engine.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SlaTargetRules, SlaTrigger, SlaCondition } from '../interfaces';

@Injectable()
export class SlaRulesEngineService {
  private readonly logger = new Logger(SlaRulesEngineService.name);

  /**
   * Evaluates if a trigger should be activated based on event and conditions
   */
  evaluateTrigger(trigger: SlaTrigger, event: string, eventData: any): boolean {
    // Check if event matches
    // Backward compatibility: 'case.created.sync' should match rules for 'case.created'
    const eventMatches =
      trigger.event === event ||
      (trigger.event === 'case.created' && event === 'case.created.sync');

    if (!eventMatches) {
      return false;
    }

    // If no conditions, trigger is activated
    if (!trigger.conditions || trigger.conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions (AND logic)
    return trigger.conditions.every((condition) =>
      this.evaluateCondition(condition, eventData),
    );
  }

  /**
   * Evaluates a single condition against event data
   */
  private evaluateCondition(condition: SlaCondition, eventData: any): boolean {
    const fieldValue = this.getFieldValue(eventData, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'in':
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      case 'not_in':
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue)
        );
      case 'contains':
        return String(fieldValue)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
      default:
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Gets field value from event data using dot notation
   */
  private getFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Finds triggers that match the current event
   */
  findMatchingTriggers(
    rules: SlaTargetRules,
    event: string,
    eventData: any,
    action: 'start' | 'stop' | 'pause' | 'resume',
  ): SlaTrigger[] {
    const triggers: SlaTrigger[] = [];

    switch (action) {
      case 'start':
        triggers.push(...rules.startTriggers);
        break;
      case 'stop':
        triggers.push(...rules.stopTriggers);
        break;
      case 'pause':
        triggers.push(...rules.pauseTriggers);
        break;
      case 'resume':
        triggers.push(...rules.resumeTriggers);
        break;
    }

    return triggers.filter((trigger) =>
      this.evaluateTrigger(trigger, event, eventData),
    );
  }
}
