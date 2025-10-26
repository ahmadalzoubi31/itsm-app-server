// src/db/seeds/default-templates.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { NotificationTemplate } from '@modules/email/entities/notification-template.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Service } from '@modules/catalog/entities/service.entity';
import { RequestTemplate } from '@modules/catalog/entities/request-template.entity';

export default class DefaultTemplatesSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('📧 Starting default templates seeding...');

    // 1. Seed notification templates for each business line
    await this.seedNotificationTemplates(dataSource);

    // 2. Seed catalog services and templates
    await this.seedCatalogTemplates(dataSource);

    console.log('✅ Default templates seeding completed successfully!');
  }

  private async seedNotificationTemplates(
    dataSource: DataSource,
  ): Promise<void> {
    console.log('📨 Seeding notification templates...');
    const templateRepo = dataSource.getRepository(NotificationTemplate);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get all business lines
    const businessLines = await businessLineRepo.find();
    const systemId = '550e8400-e29b-41d4-a716-446655440000';

    // Standard notification templates for each business line
    const notificationTemplates = [
      // Case Lifecycle
      {
        key: 'case.created',
        subject: 'New Case {{case.number}} - {{case.title}}',
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f8fc; padding: 30px; border-radius: 0 0 8px 8px; }
    .case-number { font-size: 24px; font-weight: bold; color: #667eea; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
    .label { font-weight: 600; color: #666; }
    .value { color: #333; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">{{case.businessLine.name}} Service</h1>
    </div>
    <div class="content">
      <h2>New Case Created</h2>
      <p>Your request has been registered in our system.</p>
      
      <div class="case-number">{{case.number}}</div>
      
      <div class="info-row">
        <span class="label">Title:</span>
        <span class="value">{{case.title}}</span>
      </div>
      {{#if case.description}}
      <div class="info-row">
        <span class="label">Description:</span>
        <span class="value">{{case.description}}</span>
      </div>
      {{/if}}
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="value">{{case.status}}</span>
      </div>
      <div class="info-row">
        <span class="label">Priority:</span>
        <span class="value">{{case.priority}}</span>
      </div>
      {{#if case.assignmentGroup}}
      <div class="info-row">
        <span class="label">Assigned To:</span>
        <span class="value">{{case.assignmentGroup.name}}</span>
      </div>
      {{/if}}
      {{#if case.assignee}}
      <div class="info-row">
        <span class="label">Agent:</span>
        <span class="value">{{case.assignee.displayName}}</span>
      </div>
      {{/if}}
      {{#if case.dueDate}}
      <div class="info-row">
        <span class="label">Due Date:</span>
        <span class="value">{{case.dueDate}}</span>
      </div>
      {{/if}}
    </div>
    <div class="footer">
      This is an automated notification. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`,
      },
      {
        key: 'case.assigned',
        subject: 'Case {{case.number}} Assigned to You',
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f8fc; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Case Assignment</h1>
    </div>
    <div class="content">
      <div class="alert">
        ⚡ Action Required: Case {{case.number}} has been assigned to you.
      </div>
      <h2>{{case.title}}</h2>
      <p><strong>Requester:</strong> {{case.requester.displayName}}</p>
      <p><strong>Priority:</strong> {{case.priority}}</p>
      <p><strong>Status:</strong> {{case.status}}</p>
      {{#if case.dueDate}}
      <p><strong>Due Date:</strong> {{case.dueDate}}</p>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
      },
      {
        key: 'case.status.changed',
        subject: 'Case {{case.number}} Status Update - {{case.status}}',
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f8fc; padding: 30px; border-radius: 0 0 8px 8px; }
    .status-badge { display: inline-block; background: #667eea; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Case Status Update</h1>
    </div>
    <div class="content">
      <p>Your case <strong>{{case.number}}</strong> has been updated:</p>
      <h2>{{case.title}}</h2>
      <p><span class="status-badge">{{case.status}}</span></p>
      <p><strong>Updated by:</strong> {{actor.actorName}}</p>
      <p><strong>Previous Status:</strong> {{before.status}}</p>
      <p><strong>Current Status:</strong> {{after.status}}</p>
    </div>
  </div>
</body>
</html>`,
      },
      {
        key: 'case.comment.added',
        subject: 'New Comment on Case {{case.number}}',
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f8fc; padding: 30px; border-radius: 0 0 8px 8px; }
    .comment-box { background: white; border-left: 4px solid #667eea; padding: 16px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Comment Added</h1>
    </div>
    <div class="content">
      <p>A new comment has been added to case <strong>{{case.number}}</strong>.</p>
      <h2>{{case.title}}</h2>
      <div class="comment-box">
        <p><strong>{{actor.actorName}}</strong> commented:</p>
        <p>{{comment.content}}</p>
        <small>{{comment.createdAt}}</small>
      </div>
    </div>
  </div>
</body>
</html>`,
      },
      {
        key: 'sla.breached',
        subject: '⚠️ SLA Breached - Case {{case.number}}',
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f8fc; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ SLA Breach Alert</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>ALERT:</strong> Service Level Agreement has been breached for Case {{case.number}}.
      </div>
      <h2>{{case.title}}</h2>
      <p><strong>Breach Type:</strong> {{sla.target}}</p>
      <p><strong>Original SLA:</strong> {{sla.duration}} hours</p>
      <p><strong>Current Time:</strong> {{sla.elapsed}} hours</p>
      <p><strong>Assignment Group:</strong> {{case.assignmentGroup.name}}</p>
    </div>
  </div>
</body>
</html>`,
      },
    ];

    // Seed templates for each business line
    for (const bl of businessLines) {
      for (const tplData of notificationTemplates) {
        const existing = await templateRepo.findOne({
          where: {
            businessLineId: bl.id,
            key: tplData.key,
          },
        });

        if (!existing) {
          const template = templateRepo.create({
            ...tplData,
            businessLineId: bl.id,
            createdById: systemId,
            createdByName: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await templateRepo.save(template);
          console.log(`  ✓ Created ${tplData.key} for ${bl.name}`);
        } else {
          console.log(`  ⊙ ${tplData.key} already exists for ${bl.name}`);
        }
      }
    }
  }

  private async seedCatalogTemplates(dataSource: DataSource): Promise<void> {
    console.log('📋 Seeding catalog templates...');
    const serviceRepo = dataSource.getRepository(Service);
    const templateRepo = dataSource.getRepository(RequestTemplate);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    const systemId = '550e8400-e29b-41d4-a716-446655440000';

    // Get business lines
    const businessLines = await businessLineRepo.find();
    const itBl = businessLines.find((bl) => bl.key === 'it');

    if (!itBl) {
      console.log('  ⊙ IT business line not found, skipping catalog templates');
      return;
    }

    // Modern ITSM Catalog Templates
    const catalogServices = [
      {
        key: 'it-helpdesk',
        name: 'IT Helpdesk',
        description: 'IT support and technical assistance services',
        businessLineId: itBl.id,
      },
      {
        key: 'it-onboarding',
        name: 'Employee Onboarding',
        description: 'IT equipment and access setup for new employees',
        businessLineId: itBl.id,
      },
      {
        key: 'it-software',
        name: 'Software & License Requests',
        description: 'Request software installations or licenses',
        businessLineId: itBl.id,
      },
    ];

    for (const svcData of catalogServices) {
      let service = await serviceRepo.findOne({
        where: { key: svcData.key },
      });

      if (!service) {
        service = serviceRepo.create({
          ...svcData,
          createdById: systemId,
          createdByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await serviceRepo.save(service);
        console.log(`  ✓ Created service: ${svcData.name}`);
      } else {
        console.log(`  ⊙ Service already exists: ${svcData.name}`);
      }

      // Seed request templates for this service
      await this.seedRequestTemplates(
        templateRepo,
        service.id,
        service.key,
        itBl.id,
        systemId,
      );
    }
  }

  private async seedRequestTemplates(
    templateRepo: any,
    serviceId: string,
    serviceKey: string,
    businessLineId: string,
    systemId: string,
  ): Promise<void> {
    const templates: Record<string, any> = {
      'it-helpdesk': [
        {
          key: 'password-reset',
          name: 'Password Reset',
          jsonSchema: {
            type: 'object',
            properties: {
              accountType: {
                type: 'string',
                enum: ['Windows', 'Email', 'Application'],
                title: 'Account Type',
              },
              urgency: {
                type: 'string',
                enum: ['Low', 'Medium', 'High', 'Critical'],
                title: 'Urgency',
              },
              description: {
                type: 'string',
                title: 'Additional Details',
              },
            },
            required: ['accountType'],
          },
          defaults: { urgency: 'Medium' },
        },
        {
          key: 'hardware-issue',
          name: 'Hardware Issue',
          jsonSchema: {
            type: 'object',
            properties: {
              deviceType: {
                type: 'string',
                enum: ['Laptop', 'Desktop', 'Printer', 'Mobile', 'Other'],
                title: 'Device Type',
              },
              issue: {
                type: 'string',
                title: 'Issue Description',
              },
              urgency: {
                type: 'string',
                enum: ['Low', 'Medium', 'High', 'Critical'],
                title: 'Urgency',
              },
            },
            required: ['deviceType', 'issue'],
          },
          defaults: { urgency: 'Medium' },
        },
      ],
      'it-onboarding': [
        {
          key: 'new-employee-setup',
          name: 'New Employee IT Setup',
          jsonSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                format: 'date',
                title: 'Employee Start Date',
              },
              role: {
                type: 'string',
                title: 'Job Title/Role',
              },
              equipment: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Laptop', 'Desktop', 'Mobile Phone', 'Headset'],
                },
                title: 'Required Equipment',
              },
              software: {
                type: 'array',
                items: { type: 'string' },
                title: 'Required Software',
              },
              department: {
                type: 'string',
                title: 'Department',
              },
              manager: {
                type: 'string',
                title: 'Manager Name',
              },
            },
            required: ['startDate', 'role', 'equipment'],
          },
        },
      ],
      'it-software': [
        {
          key: 'install-software',
          name: 'Software Installation Request',
          jsonSchema: {
            type: 'object',
            properties: {
              softwareName: {
                type: 'string',
                title: 'Software Name',
              },
              version: {
                type: 'string',
                title: 'Version/Details',
              },
              businessJustification: {
                type: 'string',
                title: 'Business Justification',
              },
              urgency: {
                type: 'string',
                enum: ['Low', 'Medium', 'High', 'Critical'],
                title: 'Urgency',
              },
            },
            required: ['softwareName', 'businessJustification'],
          },
          defaults: { urgency: 'Low' },
        },
      ],
    };

    const serviceTemplates = templates[serviceKey] || [];

    for (const tplData of serviceTemplates) {
      const existing = await templateRepo.findOne({
        where: { key: tplData.key },
      });

      if (!existing) {
        const template = templateRepo.create({
          ...tplData,
          serviceId,
          businessLineId,
          active: true,
          createdById: systemId,
          createdByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await templateRepo.save(template);
        console.log(`  ✓ Created template: ${tplData.name}`);
      } else {
        console.log(`  ⊙ Template already exists: ${tplData.name}`);
      }
    }
  }
}
