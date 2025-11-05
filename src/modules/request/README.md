# Request Module

The Request module allows end users to submit and track their service requests and incidents. Requests are automatically routed to Cases or Incidents based on configuration.

## Overview

The Request module provides a unified interface for users to:

- Submit service requests and incidents
- Track the status of their requests
- View linked Case/Incident information
- Get updates on request resolution

## Architecture

```
User Request → Request Entity → Route to Case/Incident → Track Status
```

### Request Types

- **ServiceRequest**: Standard service requests from end users
- **Incident**: Unplanned interruptions to services

### Request Status Flow

```
Submitted → Assigned → InProgress → Resolved → Closed
                                  ↓
                                Closed (cancelled)
```

## Features

1. **Automatic Routing**: Requests are automatically routed to Cases or Incidents based on workflow configuration
2. **Status Tracking**: Comprehensive status tracking with validation
3. **Role-Based Access**: Users can only see their own requests; agents/admins can see all
4. **Event System**: Emits events for request lifecycle changes
5. **Linked Cases**: Tracks the linked Case for each request

## API Endpoints

### Create Request

```http
POST /requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Email not working",
  "description": "Cannot access email",
  "type": "ServiceRequest",
  "priority": "Medium",
  "businessLineId": "uuid",
  "affectedServiceId": "uuid"
}
```

### List Requests

```http
GET /requests?page=1&pageSize=20&type=ServiceRequest
Authorization: Bearer {token}
```

### Get Request

```http
GET /requests/{id}
Authorization: Bearer {token}
```

### Update Request

```http
PUT /requests/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "InProgress",
  "priority": "High"
}
```

### Assign Request

```http
POST /requests/{id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assigneeId": "uuid",
  "assignmentGroupId": "uuid"
}
```

### Resolve Request

```http
POST /requests/{id}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "Issue resolved by resetting password"
}
```

## Integration with Catalog

Requests can be created from the Service Catalog:

```typescript
// Submit from catalog template
POST /catalog/templates/{id}/submit
{
  "formData": { ... }
}
```

This will:

1. Validate the form data against the template's JSON schema
2. Create a Request
3. Route it to the appropriate Case/Incident
4. Return the Request with linked Case information

## Permissions

- `request:create` - Create new requests
- `request:read:own` - Read own requests
- `request:read:assigned` - Read assigned requests
- `request:read:any` - Read any request (admin/agent)
- `request:update:assigned` - Update assigned requests

## Events

The module emits the following events:

- `request.created` - When a new request is created
- `request.assigned` - When a request is assigned
- `request.status.changed` - When request status changes

## Workflow Configuration

TODO: Implement workflow engine to:

- Route requests based on type, business line, and priority
- Configure assignment groups dynamically
- Custom routing rules per business line

## Future Enhancements

1. Workflow engine for dynamic routing
2. Incident vs Service Request separation
3. SLA tracking per request type
4. Request templates from catalog
5. Automatic categorization based on keywords
