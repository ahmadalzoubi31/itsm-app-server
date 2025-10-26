# Dynamic SLA System Documentation

## Overview

The Dynamic SLA System allows administrators to configure flexible SLA targets with multiple triggers, conditions, and priority-based rules. This system supports complex scenarios like multiple SLA targets per case, dynamic start/stop/pause/resume triggers, and module-specific configurations.

## Key Features

- **Multiple SLA Targets**: Each case can have multiple SLA targets (e.g., response + resolution)
- **Dynamic Triggers**: Configure when SLAs start, stop, pause, and resume based on events
- **Priority-Based Rules**: Different SLA times based on case priority
- **Module-Specific Rules**: Different SLA configurations for different modules (incident, request, problem)
- **Pause/Resume Support**: SLAs can be paused and resumed without losing time
- **Flexible Conditions**: Support for complex conditions using field operators

## Architecture

### Core Components

1. **SlaTarget Entity**: Stores SLA target configurations with dynamic rules
2. **SlaTimer Entity**: Tracks individual SLA timers for each case-target combination
3. **SlaRulesEngineService**: Evaluates triggers and conditions dynamically
4. **SlaService**: Main service for SLA operations
5. **SlaWorker**: Background worker that processes running timers
6. **Event Listeners**: Handle case events and trigger SLA processing

### Data Flow

```
Case Event → Event Listener → SlaService → SlaRulesEngine → Timer Updates
```

## Configuration Examples

### Example 1: Response SLA (Your Use Case)

```json
{
  "key": "respond",
  "name": "Response SLA",
  "goalMs": 14400000,
  "rules": {
    "startTriggers": [{ "event": "case.created", "action": "start" }],
    "stopTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "Resolved" }
        ],
        "action": "stop"
      },
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "InProgress" }
        ],
        "action": "stop"
      }
    ],
    "pauseTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "OnHold" }
        ],
        "action": "pause"
      }
    ],
    "resumeTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "InProgress" }
        ],
        "action": "resume"
      }
    ]
  }
}
```

### Example 2: Resolution SLA (Your Use Case)

```json
{
  "key": "resolve",
  "name": "Resolution SLA",
  "goalMs": 432000000,
  "rules": {
    "startTriggers": [{ "event": "case.created", "action": "start" }],
    "stopTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "Resolved" }
        ],
        "action": "stop"
      }
    ],
    "pauseTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "OnHold" }
        ],
        "action": "pause"
      }
    ],
    "resumeTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "InProgress" }
        ],
        "action": "resume"
      }
    ]
  }
}
```

## API Usage

### Creating SLA Targets

```bash
POST /sla/targets
Content-Type: application/json

{
  "key": "respond",
  "name": "Response SLA",
  "goalMs": 14400000,
  "rules": {
    "startTriggers": [
      { "event": "case.created", "action": "start" }
    ],
    "stopTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "Resolved" }
        ],
        "action": "stop"
      }
    ],
    "pauseTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "OnHold" }
        ],
        "action": "pause"
      }
    ],
    "resumeTriggers": [
      {
        "event": "case.status.changed",
        "conditions": [
          { "field": "to", "operator": "equals", "value": "InProgress" }
        ],
        "action": "resume"
      }
    ],
  },
  "businessLineId": "optional-business-line-id"
}
```

### Getting Examples

```bash
GET /sla/examples
```

Returns predefined example configurations for common SLA scenarios.

## Event System

### Supported Events

- `case.created`: When a new case is created
- `case.status.changed`: When case status changes
- `case.assigned`: When case is assigned to someone
- `case.reassigned`: When case is reassigned

### Event Data Structure

```typescript
interface CaseEventData {
  id: string;
  number: string;
  status?: string;
  from?: string;
  to?: string;
  priority?: string;
  module?: string;
  businessLineId?: string;
  assignedTo?: string;
  actor?: {
    actorId: string;
    actorName: string;
  };
}
```

## Condition Operators

- `equals`: Exact match
- `not_equals`: Not equal
- `in`: Value is in array
- `not_in`: Value is not in array
- `contains`: String contains substring (case-insensitive)

## Module Rules

Module rules allow different SLA configurations for different case types:

```json
"moduleRules": [
  { "module": "incident", "goalMs": 86400000 },
  { "module": "request", "goalMs": 172800000 },
  { "module": "problem", "goalMs": 604800000 }
]
```

## Timer States

- `Running`: Timer is actively counting down
- `Paused`: Timer is paused (time doesn't count)
- `Stopped`: Timer stopped without meeting SLA
- `Met`: Timer stopped and SLA was met
- `Breached`: Timer expired and SLA was breached

## Migration from Old System

The new system is backward compatible. Existing SLA targets will continue to work, but you can migrate them to use the new dynamic rules by:

1. Creating new SLA targets with the dynamic rules configuration
2. Deactivating old targets (`isActive: false`)
3. Testing the new configuration
4. Removing old targets once confirmed working

## Best Practices

1. **Start Simple**: Begin with basic start/stop triggers before adding complex conditions
2. **Test Thoroughly**: Test SLA configurations in a development environment first
3. **Monitor Performance**: The rules engine evaluates conditions for every event
4. **Use Priority Rules**: Leverage priority-based rules for different SLA times
5. **Document Configurations**: Keep track of SLA configurations for different business lines
6. **Regular Review**: Periodically review and update SLA configurations based on business needs

## Troubleshooting

### Common Issues

1. **SLA Not Starting**: Check if start triggers match the events being emitted
2. **SLA Not Stopping**: Verify stop triggers and conditions
3. **Wrong SLA Time**: Check priority rules and module rules
4. **Performance Issues**: Consider reducing the number of active SLA targets

### Debugging

Enable debug logging to see SLA processing:

```typescript
// In your case service, emit events with proper data structure
await this.eventService.emit('case.status.changed', {
  id: case.id,
  number: case.number,
  from: oldStatus,
  to: newStatus,
  businessLineId: case.businessLineId,
  priority: case.priority,
  module: case.module,
  actor: { actorId: user.id, actorName: user.username }
});
```

## Future Enhancements

- SLA escalation rules
- SLA reporting and analytics
- SLA templates for common scenarios
- SLA performance metrics
- SLA breach notifications
- SLA dashboard and monitoring
