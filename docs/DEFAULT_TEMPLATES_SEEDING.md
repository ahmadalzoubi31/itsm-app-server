# Default Templates Seeding - ITIL/ITSM & ESM Modern

## Overview

This document describes the default templates seeding system that provides out-of-the-box ITIL/ITSM and Enterprise Service Management (ESM) templates for immediate use.

## What's Seeded

### 1. Notification Email Templates

Beautiful, modern HTML email templates are seeded for each business line covering:

#### Case Lifecycle Events

- **case.created** - Welcome email when a new case is created
- **case.assigned** - Alert when a case is assigned to an agent
- **case.status.changed** - Status update notifications
- **case.comment.added** - New comment notifications
- **sla.breached** - SLA breach alerts with urgency indicators

#### Design Features

- Modern gradient headers with business line branding
- Professional typography using system fonts
- Responsive design (mobile-friendly)
- Color-coded by event type:
  - **Created**: Purple gradient (#667eea to #764ba2)
  - **Assigned**: Pink/RED alert gradient
  - **Status Changed**: Blue gradient
  - **Comment Added**: Green gradient
  - **SLA Breached**: Orange/YELLOW warning gradient

### 2. Catalog Request Templates (Self-Service)

Service templates with JSON Schema validation for structured requests:

#### IT Helpdesk Service

- **Password Reset Request**
  - Account type selection (Windows, Email, Application)
  - Urgency level
  - Description field
- **Hardware Issue Report**
  - Device type selector
  - Issue description
  - Urgency level

#### Employee Onboarding Service

- **New Employee IT Setup**
  - Start date
  - Job role
  - Equipment checklist (Laptop, Desktop, Mobile, Headset)
  - Software requirements
  - Department and manager info

#### Software & License Requests

- **Software Installation Request**
  - Software name and version
  - Business justification
  - Urgency assessment

## Benefits

### 1. ITIL/ITSM Compliance

- Follows ITIL best practices for incident, request, and service management
- Supports modern service catalog methodology
- Enables proper service portfolio management

### 2. Enterprise Service Management (ESM)

- Extends beyond IT to support multiple business lines
- Supports HR, Facilities, Finance, Legal services
- Multi-tenant architecture per business line

### 3. Production-Ready

- Beautiful, professional email templates
- No default WordPress/plain text emails
- Mobile-responsive design
- Accessibility considerations

### 4. Developer-Friendly

- Handlebars templating for flexibility
- Easy customization per business line
- JSON Schema for structured form validation
- Idempotent seeding (safe to run multiple times)

### 5. User Experience

- Self-service catalog reduces IT workload
- Clear communication with beautiful notifications
- Structured requests reduce back-and-forth
- Professional appearance builds confidence

## Technical Implementation

### Seeder Structure

```typescript
// Runs after InitialDataSeeder
DefaultTemplatesSeeder
  ├── seedNotificationTemplates()      // Email templates per BL
  └── seedCatalogTemplates()           // Services + Request templates
```

### Template Variables

#### Notification Templates (Handlebars)

Available context objects:

- `case.*` - Case data (number, title, status, priority, etc.)
- `case.requester.*` - Requester information
- `case.assignee.*` - Assignee information
- `case.assignmentGroup.*` - Group information
- `case.businessLine.*` - Business line information
- `actor.*` - Who performed the action
- `before.*` / `after.*` - State changes
- `comment.*` - Comment data
- `sla.*` - SLA breach information

#### Request Templates (JSON Schema + AJV)

- Validation with `ajv` library
- Type-safe form generation
- Default values support
- UI schema for custom rendering (future)

## Running the Seeder

```bash
# Run all seeders
npm run seed

# Or run manually
ts-node src/db/seeds/run-seeder.ts
```

## Customization

### Adding New Business Lines

Simply create a new business line, and templates are automatically seeded for it.

### Modifying Templates

1. Edit `src/db/seeds/default-templates.seeder.ts`
2. Modify the template arrays as needed
3. Re-run the seeder (it's idempotent, won't duplicate)

### Adding Custom Email Templates

Add to the `notificationTemplates` array:

```typescript
{
  key: 'custom.event',
  subject: 'Your Subject {{variable}}',
  bodyHtml: '<html>...</html>',
}
```

### Adding Catalog Templates

Add to the `templates` object in `seedRequestTemplates()`:

```typescript
'your-service-key': [
  {
    key: 'template-key',
    name: 'Template Name',
    jsonSchema: { /* AJV schema */ },
    defaults: { /* optional defaults */ }
  }
]
```

## Best Practices

1. **Keep Templates HTML**: Use inline styles for email compatibility
2. **Test Responsively**: Email clients vary widely
3. **Keep It Simple**: More HTML = more compatibility issues
4. **Validate Schemas**: Test JSON schemas work with your frontend
5. **Document Variables**: Document available Handlebars variables for users

## Future Enhancements

- [ ] Multi-language support
- [ ] Theme customization per business line
- [ ] Markdown-to-HTML conversion
- [ ] Rich text editor for template editing
- [ ] Template preview system
- [ ] A/B testing for template variations
- [ ] Analytics tracking for email opens/clicks

## Migration Path

The seeder is designed to be run during initial setup or when adding new business lines. It won't overwrite existing templates.

To update templates:

1. Manually edit templates via admin API
2. Or modify the seeder and re-run (will create new templates)

## References

- [ITIL 4](https://www.axelos.com/best-practice-solutions/itil)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [AJV JSON Schema Validator](https://ajv.js.org/)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)
