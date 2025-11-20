# Request Approval Workflow

## Overview

The approval workflow allows requests to require approval before being routed to a case. When a request card has approval steps configured, requests will enter a "Waiting Approval" status and must be approved by designated approvers before proceeding.

## How It Works

### 1. Request Creation with Approval Steps

When a user creates a request from a card that has approval steps configured:

```
User submits request
      ↓
RequestApprovalListener detects approval steps
      ↓
Request status set to "WaitingApproval"
      ↓
Step 1 approval records created
      ↓
Approvers are notified (if email configured)
```

### 2. Sequential Approval Steps

Approval steps are processed **sequentially** in the order configured:

- **Step 1** must be completed before Step 2 begins
- **Step 2** must be completed before Step 3 begins
- And so on...

### 3. Approval Step Types

#### User Approval
- Specific user must approve
- Example: Requester's direct manager

#### Manager Approval
- System automatically finds requester's manager
- Uses `metadata.manager` field from user profile
- Matches by username

#### Group Approval
- Any member of the specified group can approve
- Supports "Require All" option:
  - **requireAll = true**: All group members must approve
  - **requireAll = false**: Any one member can approve (default)

### 4. Approval Process Flow

```typescript
Request in WaitingApproval
      ↓
Approver views pending approval
      ↓
Approver takes action:
   ├─ Approve → Check if step complete
   │           ├─ More steps? → Create next step approvals
   │           └─ Last step? → Set status to "Assigned", route to case
   └─ Reject → Set status to "Closed" with rejection reason
```

## Implementation Details

### Files Created/Modified

1. **`approval/listeners/request-approval.listener.ts`** (NEW)
   - Listens for `request.created` events
   - Checks if approval steps are configured
   - Initiates approval workflow
   - Creates initial approval records

2. **`approval/approval.service.ts`** (ENHANCED)
   - `approveRequest()` - Handles approval action
   - `processApprovalStep()` - Manages step progression
   - `isApprovalStepComplete()` - Checks step completion
   - `createApprovalsForStep()` - Creates approval records
   - `getRequesterManager()` - Finds manager for approval

3. **`approval/approval.module.ts`** (UPDATED)
   - Registered `RequestApprovalListener` as provider

### Database Schema

#### ApprovalRequest Table
```typescript
{
  id: uuid,
  requestId: uuid,           // Link to request
  approverId: uuid,          // User who must approve
  stepOrder: number,         // Which step (1, 2, 3...)
  status: enum,              // PENDING, APPROVED, REJECTED
  approvedAt: timestamp,     // When approved
  rejectedAt: timestamp,     // When rejected
  justification: string,     // Approval/rejection reason
  requireAll: boolean,       // If all in group must approve
}
```

#### ApprovalSteps Table (Configuration)
```typescript
{
  id: uuid,
  requestCardId: uuid,       // Which card this applies to
  order: number,             // Step sequence (1, 2, 3...)
  type: enum,                // USER, MANAGER, GROUP
  userId: uuid,              // For USER type
  groupId: uuid,             // For GROUP type
  requireAll: boolean,       // For GROUP type
}
```

## API Endpoints

### List Pending Approvals
```
GET /api/v1/approvals/pending
```
Returns all approvals waiting for current user's action.

### Approve Request
```
POST /api/v1/approvals/:requestId/approve
Body: {
  justification?: string
}
```

### Reject Request
```
POST /api/v1/approvals/:requestId/reject
Body: {
  justification: string  // Required for rejection
}
```

## Example Scenarios

### Scenario 1: Single User Approval
```
Configuration:
  Step 1: User Approval (bader sami)

Flow:
  1. Request created → Status: WaitingApproval
  2. Approval record created for bader sami
  3. bader sami approves
  4. No more steps → Status: Assigned → Routes to case
```

### Scenario 2: Manager + Group Approval
```
Configuration:
  Step 1: Manager Approval
  Step 2: Group Approval (IT Support Team, requireAll=false)

Flow:
  1. Request created → Status: WaitingApproval
  2. Manager approval record created
  3. Manager approves
  4. Step 1 complete → Create Step 2 approvals for IT Support group
  5. Any IT Support member approves
  6. All steps complete → Status: Assigned → Routes to case
```

### Scenario 3: Require All Group Members
```
Configuration:
  Step 1: Group Approval (Finance Team, requireAll=true)

Flow:
  1. Request created → Status: WaitingApproval
  2. Approval records created for all Finance Team members
  3. First member approves → Still waiting
  4. Second member approves → Still waiting
  5. Last member approves → Step complete → Status: Assigned
```

### Scenario 4: Rejection
```
Any Step:
  1. Approver rejects with justification
  2. Request status → Closed
  3. Resolution set to rejection reason
  4. No further steps processed
  5. Requester notified
```

## Request Status Lifecycle with Approval

```
Submitted (initial)
      ↓
WaitingApproval (if approval steps configured)
      ↓
   ┌──┴──┐
   │     │
Approved  Rejected
   │     │
Assigned  Closed
   ↓
InProgress
   ↓
Resolved
   ↓
Closed
```

## Testing the Workflow

### Setup
1. Create a request card with approval steps configured
2. Ensure approver users/groups exist and are active
3. For manager approval, ensure requester has manager in metadata

### Test Cases
1. **Happy Path**: Request → Approval → Assigned → Case Created
2. **Multi-Step**: Verify sequential step progression
3. **Rejection**: Verify request closes with rejection reason
4. **Group Approval (Any)**: Verify one approval completes step
5. **Group Approval (All)**: Verify all members must approve
6. **Manager Approval**: Verify manager is correctly identified

### Verification Points
- Check request status transitions correctly
- Verify approval records are created
- Confirm sequential step processing
- Validate case creation only after final approval
- Test rejection stops workflow

## Configuration in UI

In the request card configuration (Approval tab):
1. Add approval steps in desired order
2. For each step, choose type:
   - **User Approval**: Select specific user
   - **Manager Approval**: No selection needed (automatic)
   - **Group Approval**: Select group and toggle "Require All"
3. Save configuration

## Notifications (Future Enhancement)

Future work could add:
- Email notification to approvers when approval is needed
- Notification when request is approved/rejected
- Reminder emails for pending approvals
- Mobile notifications

## Troubleshooting

### Approval Not Triggered
- Verify request card has approval steps configured
- Check `ApprovalSteps` table for card ID
- Review listener logs for initialization

### Manager Not Found
- Ensure requester has `metadata.manager` field
- Manager username must match exactly
- Manager user must exist and be active

### Group Approval Not Working
- Verify group has active members
- Check `Membership` table for group members
- Ensure `isActive = true` for members

## Performance Considerations

- Approval steps are loaded once per request creation
- Manager lookup is cached in user metadata
- Group member queries are optimized with indexes
- Sequential processing prevents approval spam

## Security

- Only designated approvers can approve/reject
- Approvers must be authenticated users
- Rejection requires justification (audit trail)
- All actions are logged in audit system

