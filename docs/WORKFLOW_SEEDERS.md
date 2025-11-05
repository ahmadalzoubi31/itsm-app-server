# Workflow Seeders

The workflow seeding system creates initial workflows for routing requests to different fulfillment applications.

## Seeded Workflows

### 1. Critical Incident Workflow

- **Key**: `critical-incident-workflow`
- **Description**: Routes critical priority requests to Incident Management
- **Target Type**: Incident
- **Evaluation Order**: 10 (highest priority - evaluates first)
- **Conditions**: priority = "Critical"
- **Assignment**: IT Support group

### 2. High Priority Incident Workflow

- **Key**: `high-priority-incident-workflow`
- **Description**: Routes high priority requests to Incident Management
- **Target Type**: Incident
- **Evaluation Order**: 20
- **Conditions**: priority = "High"
- **Assignment**: IT Support group

### 3. General Support Workflow

- **Key**: `general-support-workflow`
- **Description**: Routes general requests to Case Management
- **Target Type**: Case
- **Evaluation Order**: 100 (fallback - evaluates last)
- **Conditions**: None (catch-all for all other requests)
- **Assignment**: IT Support group

## How They Work Together

```
Request with priority="Critical"
  ↓
Evaluates all workflows (evaluation order: 10, 20, 100)
  ↓
Workflow 1 (order: 10) - Condition: priority="Critical" ✓ MATCH
  ↓
Routes to INC-000001 (Incident)
Links REQ to INC


Request with priority="High"
  ↓
Evaluates all workflows
  ↓
Workflow 1 (order: 10) - Condition: priority="Critical" ✗ NO MATCH
Workflow 2 (order: 20) - Condition: priority="High" ✓ MATCH
  ↓
Routes to INC-000002 (Incident)


Request with priority="Medium"
  ↓
Evaluates all workflows
  ↓
Workflow 1 (order: 10) - Condition: priority="Critical" ✗ NO MATCH
Workflow 2 (order: 20) - Condition: priority="High" ✗ NO MATCH
Workflow 3 (order: 100) - No conditions ✓ MATCH (catch-all)
  ↓
Routes to CS-000001 (Case)
```

## Running the Seeders

```bash
# Run seeders
npm run seed
# or
pnpm run seed
```

## Adding More Workflows

To add more workflows, edit `src/db/seeds/initial-data.seeder.ts` in the `createWorkflows` method:

```typescript
const workflowsData = [
  // ... existing workflows ...
  {
    key: 'security-problem-workflow',
    name: 'Security Problem Workflow',
    description: 'Routes security issues to Problem Management',
    targetType: WorkflowTargetType.PROBLEM,
    businessLineId: itBusinessLine.id,
    defaultAssignmentGroupId: securityGroup.id,
    active: true,
    evaluationOrder: 15,
    conditions: [
      {
        field: 'category',
        operator: 'contains' as const,
        value: 'security',
      },
    ],
  },
];
```

## Customization

### For Different Business Lines

You can add workflows for other business lines (HR, Finance, etc.):

```typescript
// Get HR business line
const hrBusinessLine = await businessLineRepo.findOne({
  where: { key: 'hr' },
});

const hrWorkflowsData = [
  {
    key: 'hr-general-workflow',
    name: 'HR General Workflow',
    targetType: WorkflowTargetType.CASE,
    businessLineId: hrBusinessLine.id,
    // ... rest of config
  },
];
```

### Conditional Routing

Examples of more complex condition matching:

```typescript
conditions: [
  {
    field: 'priority',
    operator: 'equals' as const,
    value: 'High',
  },
  {
    field: 'affectedServiceId',
    operator: 'contains' as const,
    value: 'critical',
  },
],
```

### Adding to Request Number Sequence

The seeder also creates the `request_number_seq` sequence:

```sql
CREATE SEQUENCE request_number_seq START WITH 1 INCREMENT BY 1
```

This is used to generate unique request numbers like `REQ-000001`.

## Benefits

1. **Out of the box**: Ready-to-use workflows for common scenarios
2. **Priority-based routing**: Critical/High → Incident, others → Case
3. **Extensible**: Easy to add more workflows
4. **Idempotent**: Safe to run multiple times
