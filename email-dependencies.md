# Email Module Dependencies

The following NPM packages need to be installed for the email module to work:

## Core Email Dependencies

```bash
npm install nodemailer @types/nodemailer
```

## Provider-Specific Dependencies

```bash
# For AWS SES
npm install @aws-sdk/client-ses

# For OAuth providers (Gmail, Outlook)
npm install googleapis
npm install @azure/msal-node

# For SendGrid
npm install @sendgrid/mail

# For Mailgun
npm install mailgun.js

# For IMAP (incoming email)
npm install imap @types/imap
```

## Template Engine (Optional)

```bash
# For advanced templating
npm install handlebars @types/handlebars
```

## Installation Command

Run this command in your backend project:

```bash
cd itsm-app-server
npm install nodemailer @types/nodemailer @aws-sdk/client-ses googleapis @azure/msal-node @sendgrid/mail mailgun.js imap @types/imap handlebars @types/handlebars
```

## Database Migration

After installing dependencies, you'll need to run database migrations to create the email tables:

```bash
# Generate migration
npm run typeorm:generate-migration -- CreateEmailTables

# Run migration  
npm run typeorm:run-migrations
```

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Default email settings
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
DEFAULT_FROM_NAME=ITSM System

# Email providers (configure as needed)
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# Gmail OAuth (if using Gmail)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=

# SendGrid (if using SendGrid)
SENDGRID_API_KEY=

# AWS SES (if using SES)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Mailgun (if using Mailgun)
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
``` 