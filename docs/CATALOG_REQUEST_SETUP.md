# How to Set Up a New Service Request in the Catalog

This guide explains how to set up a new service request that end users can submit from the catalog.

## Overview

The service catalog system consists of:

1. **Services** - Categories of IT services (e.g., "IT Helpdesk", "IT Software Request")
2. **Request Templates** - Form templates for specific requests (e.g., "New Laptop Request")
3. **Workflows** - Routing rules that determine where requests go (Case, Incident, etc.)

## Setup Steps

### Step 1: Get Required IDs

Before creating a template, you need:

- `businessLineId` - Business line ID (e.g., IT, HR)
- `serviceId` - Service ID (create using POST `/catalog/services`)
- `defaultAssignmentGroupId` - Group that will handle the requests
- `workflowId` (optional) - Workflow for routing

### Step 2: Create a Service (if it doesn't exist)

```bash
POST /catalog/services
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "key": "it-software-request",
  "name": "IT Software Request",
  "description": "Request software installation or licenses",
  "businessLineId": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Step 3: Create a Request Template

```bash
POST /catalog/templates
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "serviceId": "service-uuid-from-step-2",
  "key": "software-request",
  "name": "Software Installation Request",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "softwareName": {
        "type": "string",
        "title": "Software Name",
        "description": "Name of the software you need"
      },
      "version": {
        "type": "string",
        "title": "Version",
        "description": "Desired version (e.g., 2024, latest)"
      },
      "businessJustification": {
        "type": "string",
        "title": "Business Justification",
        "description": "Why do you need this software?"
      },
      "urgency": {
        "type": "string",
        "title": "Urgency",
        "enum": ["Low", "Medium", "High", "Critical"],
        "default": "Medium"
      }
    },
    "required": ["softwareName", "businessJustification"]
  },
  "uiSchema": {
    "urgency": {
      "ui:widget": "select"
    },
    "businessJustification": {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 4
      }
    }
  },
  "defaults": {
    "urgency": "Medium"
  },
  "defaultAssignmentGroupId": "group-uuid",
  "businessLineId": "550e8400-e29b-41d4-a716-446655440001",
  "workflowId": "workflow-uuid",
  "active": true
}
```

#### Key Fields Explained

**jsonSchema** (required)

- Defines the form fields and validation rules
- Uses JSON Schema format
- Common types: `string`, `number`, `boolean`, `array`, `object`
- `enum` for dropdown options
- `required` array specifies mandatory fields

**uiSchema** (optional)

- Customizes how the form fields are displayed
- Can specify widgets (textarea, select, etc.)
- Can set options like textarea rows

**defaults** (optional)

- Pre-fills form values
- Merged with user-submitted data

**workflowId** (optional)

- Links to a specific workflow for routing
- If not provided, uses workflow matching logic

### Step 4: End User Submits Request

Once the template is created, end users can browse and submit:

```bash
# List available services
GET /catalog/services
Authorization: Bearer {user-token}

# List templates for a service
GET /catalog/services/{serviceId}/templates
Authorization: Bearer {user-token}

# Get template details
GET /catalog/templates/{templateId}
Authorization: Bearer {user-token}

# Submit request from template
POST /catalog/templates/{templateId}/submit
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "formData": {
    "softwareName": "Adobe Photoshop",
    "version": "2024",
    "businessJustification": "Design team needs for creative projects",
    "urgency": "Medium"
  }
}
```

## Complete Example

### Example 1: Laptop Request Template

```bash
POST /catalog/templates
Authorization: Bearer {admin-token}
Content-Type: application/json
```

```json
{
  "serviceId": "it-hardware-request-uuid",
  "key": "new-laptop",
  "name": "New Laptop Request",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "model": {
        "type": "string",
        "title": "Preferred Model",
        "enum": ["MacBook Pro", "Dell XPS", "HP EliteBook", "Other"]
      },
      "reason": {
        "type": "string",
        "title": "Reason for Request",
        "description": "Why do you need a new laptop?"
      },
      "specialRequirements": {
        "type": "string",
        "title": "Special Requirements",
        "description": "RAM, storage, or other specifications"
      },
      "requestedDeliveryDate": {
        "type": "string",
        "format": "date",
        "title": "Requested Delivery Date"
      },
      "urgency": {
        "type": "string",
        "title": "Urgency",
        "enum": ["Low", "Medium", "High", "Critical"],
        "default": "Medium"
      }
    },
    "required": ["model", "reason"]
  },
  "uiSchema": {
    "model": {
      "ui:widget": "select"
    },
    "reason": {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 3
      }
    },
    "specialRequirements": {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 2
      }
    },
    "urgency": {
      "ui:widget": "select"
    }
  },
  "defaults": {
    "urgency": "Medium"
  },
  "defaultAssignmentGroupId": "it-support-group-uuid",
  "businessLineId": "it-business-line-uuid",
  "active": true
}
```

### Example 2: Access Request Template

```bash
POST /catalog/templates
Authorization: Bearer {admin-token}
Content-Type: application/json
```

```json
{
  "serviceId": "it-account-management-uuid",
  "key": "application-access",
  "name": "Application Access Request",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "application": {
        "type": "string",
        "title": "Application",
        "enum": ["Salesforce", "JIRA", "Confluence", "AWS Console", "Other"]
      },
      "accessType": {
        "type": "string",
        "title": "Access Type",
        "enum": ["Read", "Read/Write", "Admin"]
      },
      "businessJustification": {
        "type": "string",
        "title": "Business Justification",
        "description": "Why do you need this access?"
      },
      "requestedAccessDuration": {
        "type": "string",
        "title": "Access Duration",
        "enum": ["Permanent", "30 days", "60 days", "90 days", "6 months"]
      }
    },
    "required": ["application", "accessType", "businessJustification"]
  },
  "uiSchema": {
    "application": {
      "ui:widget": "select"
    },
    "accessType": {
      "ui:widget": "radio"
    },
    "businessJustification": {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 4
      }
    },
    "requestedAccessDuration": {
      "ui:widget": "select"
    }
  },
  "defaults": {
    "accessType": "Read"
  },
  "defaultAssignmentGroupId": "it-support-group-uuid",
  "businessLineId": "it-business-line-uuid",
  "active": true
}
```

## How Submissions Work

When a user submits a request from a catalog template:

1. **Validation**: Form data is validated against the `jsonSchema`
2. **Merging**: Default values are merged with submitted data
3. **Request Creation**: A Request record is created with:
   - Title: Template name + truncated form data
   - Description: Includes all form data
   - Priority: Determined from urgency field
   - Assignment: To `defaultAssignmentGroupId`
   - Business Line: From template
   - Template ID: Links back to the catalog template
   - Metadata: Stores the form data for reference
4. **Request Routing**: Request is routed to Case/Incident based on:
   - Template's `workflowId` (if specified)
   - Or workflow matching logic (priority, conditions)
5. **Fulfillment Entity**: A Case (or Incident) is created and linked to the Request

The response includes both the Request (with number like REQ-000001) and the linked Case/Incident.

## Finding Required UUIDs

### Get Business Line ID

```bash
GET /business-lines
Authorization: Bearer {admin-token}

# Example response
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "key": "it",
  "name": "IT"
}
```

### Get Assignment Group ID

```bash
GET /iam/groups
Authorization: Bearer {admin-token}

# Example response
[
  {
    "id": "group-uuid-123",
    "key": "it-support",
    "name": "IT Support"
  }
]
```

### Get Workflow ID (optional)

```bash
GET /workflows
Authorization: Bearer {admin-token}

# Example response
[
  {
    "id": "workflow-uuid-456",
    "key": "general-support-workflow",
    "name": "General Support Workflow"
  }
]
```

## Best Practices

1. **Use meaningful keys**: Keep them short, lowercase, hyphenated (e.g., `new-laptop`)
2. **Clear field names**: Use descriptive titles and descriptions
3. **Set defaults**: Pre-fill reasonable defaults for better UX
4. **Validation**: Use `required` array for mandatory fields
5. **UI customization**: Use `uiSchema` for better user experience
6. **Active flag**: Set `active: false` to hide from catalog without deleting

## Updating Templates

```bash
PUT /catalog/templates/{templateId}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "active": false
}
```

## Troubleshooting

### Template not showing in catalog

- Check `active: true`
- Verify `serviceId` exists
- Ensure user has access to the business line

### Validation errors

- Check `jsonSchema` syntax
- Ensure submitted data matches schema
- Check required fields are filled

### Assignment issues

- Verify `defaultAssignmentGroupId` exists
- Check group permissions
- Review workflow routing logic
