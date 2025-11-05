# Workflow-Based Request Routing

## Overview

The ITSM system now includes **Workflow-Based Routing** that allows requests to be automatically routed to different fulfillment applications (Case, Incident, Problem, Change) based on configurable business rules.

## How It Works

### Architecture Flow

```
User Request → Workflow Evaluation → Route to Fulfillment App
                    ↓
           Case / Incident / Problem / Change
                    ↓
            Link REQ to Fulfillment Entity
```

### Components

1. **Request Module** (`src/modules/request`)

   - Handles user request submission
   - Tracks request status and lifecycle
   - Links to fulfillment entities

2. **Workflow Module** (`src/modules/workflow`)

   - Defines routing rules
   - Evaluates conditions
   - Determines target fulfillment app

3. **Request Template** (Catalog Module)
   - Can be wired to specific workflows
   - Provides structured request forms
   - Includes metadata for condition matching

## Workflow Configuration

### Creating a Workflow

```http
POST /workflows
{
  "key": "it-support-workflow",
  "name": "IT Support Workflow",
  "description": "Routes IT requests to support cases",
  "targetType": "Case",
  "businessLineId": "550e8400-e29b-41d4-a716-446655440001",
  "defaultAssignmentGroupId": "group-uuid",
  "active": true,
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

### Workflow Target Types

- **Case**: General service requests and support
- **Incident**: Unplanned service interruptions
- **Problem**: Root cause analysis
- **Change**: Planned modifications

### Condition Operators

- `equals`: Exact match
- `contains`: String contains
- `greaterThan`: Numeric greater than
- `lessThan`: Numeric less than

## Request Routing Examples

### Example 1: High Priority → Incident

```json
// Workflow configuration
{
  "key": "critical-incident-workflow",
  "targetType": "Incident",
  "businessLineId": "it-uuid",
  "evaluationOrder": 10,  // Evaluates early
  "conditions": [
    { "field": "priority", "operator": "equals", "value": "Critical" }
  ]
}

// Request creation
POST /requests
{
  "title": "Email server down",
  "priority": "Critical",
  "businessLineId": "it-uuid"
}

// Result
→ Routes to INC-000001 (Incident)
→ REQ links to INC-000001
```

### Example 2: Standard Request → Case

```json
// Workflow configuration
{
  "key": "general-support-workflow",
  "targetType": "Case",
  "businessLineId": "it-uuid",
  "evaluationOrder": 100,  // Evaluates later
  // No conditions = catch-all
}

// Request creation
POST /requests
{
  "title": "Need new laptop",
  "priority": "Medium",
  "businessLineId": "it-uuid"
}

// Result
→ Routes to CS-000001 (Case)
→ REQ links to CS-000001
```

### Example 3: Template → Specific Workflow

```json
// Template with workflowId
RequestTemplate {
  name: "Security Incident Report",
  workflowId: "security-incident-workflow-uuid",
  jsonSchema: {...}
}

// User submits from template
POST /catalog/templates/{id}/submit
{
  "formData": { "severity": "high" }
}

// Result
→ Uses security-incident-workflow
→ Routes to Incident
→ REQ links to INC-000002
```

## Workflow Evaluation Process

1. **Request Created**: User submits request via API or catalog
2. **Template Check**: If from template with `workflowId`, use that workflow
3. **Workflow Search**: Find all active workflows for business line
4. **Condition Matching**: Evaluate each workflow's conditions
5. **Priority Selection**: Choose workflow with lowest `evaluationOrder`
6. **Routing**: Create fulfillment entity based on `targetType`
7. **Linking**: Link REQ to fulfillment entity

## Integration Points

### Catalog Integration

Request templates can specify workflows:

```typescript
RequestTemplate {
  id: "...",
  name: "Laptop Request",
  workflowId: "laptop-request-workflow", // OPTIONAL
  jsonSchema: {...}
}
```

### Business Line Configuration

Each business line can have multiple workflows:

```
IT Department:
  - Workflow 1: Critical issues → Incident (order: 10)
  - Workflow 2: Security issues → Problem (order: 20)
  - Workflow 3: General requests → Case (order: 100)

HR Department:
  - Workflow 1: Employee requests → Case (order: 100)
```

### Assignment Groups

Workflows determine assignment groups:

```typescript
Workflow {
  defaultAssignmentGroupId: "support-group-id"
}

// Request gets assigned to this group automatically
// Can be overridden by template's defaultAssignmentGroupId
```

## API Usage

### Creating a Request

```bash
POST /requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Need access to Salesforce",
  "type": "ServiceRequest",
  "priority": "Medium",
  "businessLineId": "it-uuid",
  "affectedServiceId": "salesforce-uuid"
}

# Response
{
  "id": "req-uuid",
  "number": "REQ-000001",
  "status": "Submitted",
  "linkedCaseId": "case-uuid",
  "linkedCase": {
    "number": "CS-000045",
    "title": "Need access to Salesforce"
  }
}
```

### Listing Requests

```bash
GET /requests?status=Submitted&type=ServiceRequest
Authorization: Bearer {token}
```

### Getting Request with Linked Entity

```bash
GET /requests/REQ-000001
Authorization: Bearer {token}

# Response includes linkedCase
{
  "number": "REQ-000001",
  "linkedCase": {
    "number": "CS-000045",
    "status": "InProgress"
  }
}
```

## Workflow Management (Admin)

### List Workflows

```bash
GET /workflows
Authorization: Bearer {admin-token}
```

### Create Workflow

```bash
POST /workflows
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "key": "my-workflow",
  "name": "My Workflow",
  "targetType": "Incident",
  "businessLineId": "uuid",
  "defaultAssignmentGroupId": "uuid",
  "evaluationOrder": 50,
  "conditions": [...]
}
```

### Update Workflow

```bash
PUT /workflows/{id}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "active": false,
  "evaluationOrder": 200
}
```

## Benefits

1. **Flexible Routing**: Route to the right application automatically
2. **Business Rules**: Configure routing based on conditions
3. **Priority Handling**: Critical issues go to Incident first
4. **Scalable**: Add new workflows without code changes
5. **Audit Trail**: Track which workflow was used for each request

## Future Enhancements

1. Multi-step approval workflows
2. Dynamic assignment based on workload
3. Workflow chains (route to multiple apps)
4. SLA per workflow type
5. Workflow analytics and reporting
