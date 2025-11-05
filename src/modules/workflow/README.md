# Workflow Module

The Workflow module provides dynamic routing for requests to different fulfillment applications (Case, Incident, Problem, Change) based on configurable rules.

## Overview

Workflows allow administrators to:

- Define routing rules based on request type, business line, and conditions
- Route requests to the appropriate fulfillment application automatically
- Configure assignment groups dynamically
- Set up conditional routing based on metadata

## Architecture

```
Request → Workflow Evaluation → Route to Fulfillment App (Case/Incident/Problem/Change)
```

### Workflow Types (Targets)

- **Case**: General service requests and support cases
- **Incident**: Unplanned interruptions to services
- **Problem**: Root cause analysis
- **Change**: Planned changes to services

## Workflow Configuration

### Example: IT Support Workflow

```json
{
  "key": "it-support-workflow",
  "name": "IT Support Workflow",
  "description": "Routes IT requests to support cases",
  "targetType": "Case",
  "businessLineId": "550e8400-e29b-41d4-a716-446655440001",
  "defaultAssignmentGroupId": "support-group-id",
  "active": true,
  "evaluationOrder": 100
}
```

### Example: High Priority Incident Workflow

```json
{
  "key": "high-priority-incident-workflow",
  "name": "High Priority Incident Workflow",
  "description": "Routes high priority issues to Incident Management",
  "targetType": "Incident",
  "businessLineId": "550e8400-e29b-41d4-a716-446655440001",
  "defaultAssignmentGroupId": "incident-group-id",
  "active": true,
  "evaluationOrder": 50,
  "conditions": [
    {
      "field": "priority",
      "operator": "equals",
      "value": "High"
    },
    {
      "field": "affectedServiceId",
      "operator": "contains",
      "value": "critical"
    }
  ]
}
```

## How It Works

1. **Request Creation**: User submits a request via catalog or direct API
2. **Workflow Evaluation**: System finds active workflows for the business line
3. **Condition Matching**: Evaluates conditions against request metadata
4. **Priority**: Uses workflows with lower `evaluationOrder` first
5. **Routing**: Creates Case/Incident/Problem/Change in the target application
6. **Linkage**: Links the request to the created fulfillment entity

## Workflow Conditions

Conditions allow dynamic routing based on request metadata:

```typescript
conditions: [
  { field: 'priority', operator: 'equals', value: 'High' },
  { field: 'category', operator: 'contains', value: 'urgent' },
  { field: 'affectedUsers', operator: 'greaterThan', value: 10 },
];
```

### Supported Operators

- `equals`: Exact match
- `contains`: String contains
- `greaterThan`: Numeric greater than
- `lessThan`: Numeric less than

## API Endpoints

### Create Workflow (Admin Only)

```http
POST /workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "it-support-workflow",
  "name": "IT Support Workflow",
  "targetType": "Case",
  "businessLineId": "uuid",
  "defaultAssignmentGroupId": "uuid",
  "evaluationOrder": 100,
  "conditions": [
    {
      "field": "priority",
      "operator": "equals",
      "value": "High"
    }
  ]
}
```

### List Workflows

```http
GET /workflows
Authorization: Bearer {token}
```

### Update Workflow

```http
PUT /workflows/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "active": false,
  "evaluationOrder": 200
}
```

## Integration with Request Templates

Request templates can be wired to specific workflows:

```typescript
// RequestTemplate entity
{
  id: "...",
  name: "Laptop Request",
  workflowId: "workflow-id-here", // Links to specific workflow
  jsonSchema: {...}
}
```

When a request is created from a template:

1. If template has `workflowId`, use that workflow
2. Otherwise, evaluate all workflows for the business line
3. Match conditions and select the best workflow

## Request Flow

```
User submits request
  ↓
Check if from template (has workflowId?)
  ↓ Yes → Use template's workflow
  ↓ No  → Evaluate all workflows for business line
         ↓
      Match conditions
         ↓
      Select workflow (lowest evaluationOrder)
         ↓
Create Case/Incident based on targetType
         ↓
Link REQ → Fulfillment Entity
```

## Priority Rules

Workflows support automatic priority mapping:

```json
{
  "priorityRules": {
    "Low": "Low",
    "Medium": "Medium",
    "High": "High",
    "Critical": "Critical"
  }
}
```

This allows routing-level priority adjustments.

## Use Cases

### Use Case 1: Service Request → Case

- Create workflow with `targetType: "Case"`
- Map service requests to support cases
- Default assignment to support group

### Use Case 2: Critical Issue → Incident

- Create workflow with `targetType: "Incident"`
- Conditions: priority = "Critical"
- Lower evaluationOrder (evaluates first)
- Route to incident management group

### Use Case 3: Security Issue → Problem

- Create workflow with `targetType: "Problem"`
- Conditions: category contains "security"
- Route to security team

## Future Enhancements

1. **Multi-step workflows**: Support for approval workflows
2. **Dynamic assignment**: Assign based on workload
3. **Workflow chains**: Route to multiple fulfillment apps
4. **SLA integration**: Different SLAs per workflow
5. **Workflow analytics**: Track routing effectiveness
