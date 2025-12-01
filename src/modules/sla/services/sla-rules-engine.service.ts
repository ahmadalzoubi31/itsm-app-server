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
      this.logger.debug(
        `Trigger matched (no conditions required) for event ${event}`,
      );
      return true;
    }

    // Evaluate all conditions (AND logic)
    const conditionsMatch = trigger.conditions.every((condition) =>
      this.evaluateCondition(condition, eventData),
    );

    if (!conditionsMatch) {
      this.logger.debug(
        `Trigger conditions did not match for event ${event}, trigger: ${JSON.stringify(trigger)}`,
      );
    }

    return conditionsMatch;
  }

  /**
   * Evaluates a single condition against event data
   */
  private evaluateCondition(condition: SlaCondition, eventData: any): boolean {
    const fieldValue = this.getFieldValue(eventData, condition.field);
    let result = false;

    switch (condition.operator) {
      case 'equals':
        result = fieldValue === condition.value;
        break;
      case 'not_equals':
        result = fieldValue !== condition.value;
        break;
      case 'in':
        result =
          Array.isArray(condition.value) &&
          condition.value.includes(fieldValue);
        break;
      case 'not_in':
        result =
          Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue);
        break;
      case 'contains':
        result = String(fieldValue)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
        break;
      default:
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }

    if (!result) {
      this.logger.debug(
        `Condition failed: field ${condition.field} (${fieldValue}) ${condition.operator} ${condition.value}`,
      );
    }

    return result;
  }

  /**
   * Gets field value from event data using dot notation
   */
  private getFieldValue(data: any, field: string): any {
    if (!field) return undefined;

    // Support bracket notation: a[0] -> a.0 ; ['key'] or ["key"] -> .key
    const normalized = String(field)
      .replace(/\[(?:'|")([^\]]+?)(?:'|")\]/g, '.$1')
      .replace(/\[(\d+)\]/g, '.$1');

    const parts = normalized.split('.').filter((p) => p.length);
    let value = data;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (value === null || value === undefined) return undefined;

      // direct property or array index
      if (
        (typeof value === 'object' &&
          Object.prototype.hasOwnProperty.call(value, part)) ||
        (Array.isArray(value) && !Number.isNaN(Number(part)))
      ) {
        value = value[part as any];
        continue;
      }

      // if single-segment and not found, try common wrappers like after/before/data/payload
      if (parts.length === 1 && i === 0 && typeof value === 'object') {
        if (
          value.after &&
          typeof value.after === 'object' &&
          Object.prototype.hasOwnProperty.call(value.after, part)
        ) {
          return value.after[part];
        }
        if (
          value.before &&
          typeof value.before === 'object' &&
          Object.prototype.hasOwnProperty.call(value.before, part)
        ) {
          return value.before[part];
        }
        if (
          value.data &&
          typeof value.data === 'object' &&
          Object.prototype.hasOwnProperty.call(value.data, part)
        ) {
          return value.data[part];
        }
        if (
          value.payload &&
          typeof value.payload === 'object' &&
          Object.prototype.hasOwnProperty.call(value.payload, part)
        ) {
          return value.payload[part];
        }

        // fallback: shallow recursive search (depth-limited)
        return this.findKeyRecursive(value, part, 3);
      }

      return undefined;
    }

    return value;
  }

  private findKeyRecursive(obj: any, key: string, depth: number): any {
    if (depth < 0 || obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return undefined;

    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];

    for (const k of Object.keys(obj)) {
      try {
        const val = obj[k];
        if (typeof val === 'object') {
          const found = this.findKeyRecursive(val, key, depth - 1);
          if (found !== undefined) return found;
        }
      } catch (_e) {
        // ignore access errors
      }
    }

    return undefined;
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

    const matching = triggers.filter((trigger) =>
      this.evaluateTrigger(trigger, event, eventData),
    );

    if (matching.length > 0) {
      this.logger.debug(
        `Found ${matching.length} matching ${action} triggers for event ${event}`,
      );
    }

    return matching;
  }
}
