import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
import { EmailTemplateTypeEnum } from './enums';
import { EMAIL_TEMPLATE_VARIABLES } from './constants/email-template.constant';

@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  async create(createEmailTemplateDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const template = this.emailTemplateRepository.create({
      ...createEmailTemplateDto,
      variables: createEmailTemplateDto.variables || this.getDefaultVariables(createEmailTemplateDto.type),
    });

    return this.emailTemplateRepository.save(template);
  }

  async findAll(): Promise<EmailTemplate[]> {
    return this.emailTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Email template with ID ${id} not found`);
    }

    return template;
  }

  async findByType(type: EmailTemplateTypeEnum): Promise<EmailTemplate[]> {
    return this.emailTemplateRepository.find({
      where: { type },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByType(type: EmailTemplateTypeEnum): Promise<EmailTemplate | null> {
    return this.emailTemplateRepository.findOne({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateEmailTemplateDto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    
    Object.assign(template, updateEmailTemplateDto);
    
    return this.emailTemplateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.emailTemplateRepository.remove(template);
  }

  async activate(id: string): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    
    // Deactivate other templates of the same type
    await this.emailTemplateRepository.update(
      { type: template.type, isActive: true },
      { isActive: false }
    );
    
    // Activate this template
    template.isActive = true;
    return this.emailTemplateRepository.save(template);
  }

  async deactivate(id: string): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    template.isActive = false;
    return this.emailTemplateRepository.save(template);
  }

  async getTemplateVariables(type: EmailTemplateTypeEnum): Promise<string[]> {
    return this.getDefaultVariables(type);
  }

  async previewTemplate(id: string, data: Record<string, any>): Promise<{ subject: string; htmlBody: string; textBody: string }> {
    const template = await this.findOne(id);
    
    return {
      subject: this.processTemplate(template.subject, data),
      htmlBody: this.processTemplate(template.htmlBody, data),
      textBody: this.processTemplate(template.textBody, data),
    };
  }

  async validateTemplate(templateContent: string, variables: string[]): Promise<{ isValid: boolean; missingVariables: string[]; unusedVariables: string[] }> {
    // Extract variables from template
    const usedVariables = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    
    while ((match = regex.exec(templateContent)) !== null) {
      usedVariables.add(match[1]);
    }

    const providedVariables = new Set(variables);
    const missingVariables = Array.from(usedVariables).filter(v => !providedVariables.has(v));
    const unusedVariables = Array.from(providedVariables).filter(v => !usedVariables.has(v));

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      unusedVariables,
    };
  }

  async duplicateTemplate(id: string, newName: string): Promise<EmailTemplate> {
    const originalTemplate = await this.findOne(id);
    
    const duplicatedTemplate = this.emailTemplateRepository.create({
      ...originalTemplate,
      id: undefined, // Remove ID to create new entity
      name: newName,
      isActive: false, // Duplicated templates start as inactive
      createdAt: undefined,
      updatedAt: undefined,
      createdBy: undefined,
      updatedBy: undefined,
    });

    return this.emailTemplateRepository.save(duplicatedTemplate);
  }

  async seedDefaultTemplates(): Promise<void> {
    // Check if templates already exist
    const existingTemplates = await this.emailTemplateRepository.count();
    if (existingTemplates > 0) {
      return; // Templates already seeded
    }

    const defaultTemplates = [
      {
        name: 'Incident Created Notification',
        type: EmailTemplateTypeEnum.INCIDENT_NOTIFICATION,
        subject: '{{subjectPrefix}} New Incident Created - {{title}}',
        htmlBody: `
          <h2>New Incident Created</h2>
          <p><strong>Incident ID:</strong> {{incidentId}}</p>
          <p><strong>Title:</strong> {{title}}</p>
          <p><strong>Priority:</strong> {{priority}}</p>
          <p><strong>Assignee:</strong> {{assignee}}</p>
          <p><strong>Reporter:</strong> {{reporter}}</p>
          <p><strong>Category:</strong> {{category}}</p>
          <p><strong>Description:</strong></p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
            {{description}}
          </div>
          <p><strong>Created At:</strong> {{timestamp}}</p>
          <p>Please take appropriate action.</p>
        `,
        textBody: `
          New Incident Created
          
          Incident ID: {{incidentId}}
          Title: {{title}}
          Priority: {{priority}}
          Assignee: {{assignee}}
          Reporter: {{reporter}}
          Category: {{category}}
          
          Description:
          {{description}}
          
          Created At: {{timestamp}}
          
          Please take appropriate action.
        `,
        variables: this.getDefaultVariables(EmailTemplateTypeEnum.INCIDENT_NOTIFICATION),
        isActive: true,
      },
      {
        name: 'Service Request Notification',
        type: EmailTemplateTypeEnum.SERVICE_REQUEST_NOTIFICATION,
        subject: '{{subjectPrefix}} Service Request {{status}} - {{title}}',
        htmlBody: `
          <h2>Service Request {{status}}</h2>
          <p><strong>Request ID:</strong> {{requestId}}</p>
          <p><strong>Title:</strong> {{title}}</p>
          <p><strong>Status:</strong> {{status}}</p>
          <p><strong>Requester:</strong> {{requester}}</p>
          <p><strong>Approver:</strong> {{approver}}</p>
          <p><strong>Category:</strong> {{category}}</p>
          <p><strong>Description:</strong></p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
            {{description}}
          </div>
          <p><strong>Timestamp:</strong> {{timestamp}}</p>
        `,
        textBody: `
          Service Request {{status}}
          
          Request ID: {{requestId}}
          Title: {{title}}
          Status: {{status}}
          Requester: {{requester}}
          Approver: {{approver}}
          Category: {{category}}
          
          Description:
          {{description}}
          
          Timestamp: {{timestamp}}
        `,
        variables: this.getDefaultVariables(EmailTemplateTypeEnum.SERVICE_REQUEST_NOTIFICATION),
        isActive: true,
      },
      {
        name: 'Welcome Email',
        type: EmailTemplateTypeEnum.USER_WELCOME,
        subject: 'Welcome to ITSM System - {{firstName}} {{lastName}}',
        htmlBody: `
          <h2>Welcome to ITSM System!</h2>
          <p>Dear {{firstName}} {{lastName}},</p>
          <p>Your account has been successfully created in our ITSM system.</p>
          <p><strong>Account Details:</strong></p>
          <ul>
            <li>Username: {{username}}</li>
            <li>Email: {{email}}</li>
            <li>Role: {{role}}</li>
          </ul>
          <p>You can access the system at: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
          <p>If you have any questions, please contact our support team at {{supportEmail}}</p>
          <p>Best regards,<br>ITSM System Team</p>
        `,
        textBody: `
          Welcome to ITSM System!
          
          Dear {{firstName}} {{lastName}},
          
          Your account has been successfully created in our ITSM system.
          
          Account Details:
          - Username: {{username}}
          - Email: {{email}}
          - Role: {{role}}
          
          You can access the system at: {{loginUrl}}
          
          If you have any questions, please contact our support team at {{supportEmail}}
          
          Best regards,
          ITSM System Team
        `,
        variables: this.getDefaultVariables(EmailTemplateTypeEnum.USER_WELCOME),
        isActive: true,
      },
      {
        name: 'Password Reset',
        type: EmailTemplateTypeEnum.PASSWORD_RESET,
        subject: 'Password Reset Request - ITSM System',
        htmlBody: `
          <h2>Password Reset Request</h2>
          <p>Dear {{firstName}} {{lastName}},</p>
          <p>We received a request to reset your password for your ITSM system account.</p>
          <p>To reset your password, please click the link below:</p>
          <p><a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>This link will expire at {{expirationTime}}.</p>
          <p>If you did not request this password reset, please ignore this email or contact our support team at {{supportEmail}}</p>
          <p>Best regards,<br>ITSM System Team</p>
        `,
        textBody: `
          Password Reset Request
          
          Dear {{firstName}} {{lastName}},
          
          We received a request to reset your password for your ITSM system account.
          
          To reset your password, please visit the following link:
          {{resetLink}}
          
          This link will expire at {{expirationTime}}.
          
          If you did not request this password reset, please ignore this email or contact our support team at {{supportEmail}}
          
          Best regards,
          ITSM System Team
        `,
        variables: this.getDefaultVariables(EmailTemplateTypeEnum.PASSWORD_RESET),
        isActive: true,
      },
      {
        name: 'System Maintenance Notification',
        type: EmailTemplateTypeEnum.SYSTEM_MAINTENANCE,
        subject: '{{subjectPrefix}} System Maintenance: {{maintenanceTitle}}',
        htmlBody: `
          <h2>System Maintenance Notification</h2>
          <p><strong>Maintenance:</strong> {{maintenanceTitle}}</p>
          <p><strong>Description:</strong></p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
            {{description}}
          </div>
          <p><strong>Start Time:</strong> {{startTime}}</p>
          <p><strong>End Time:</strong> {{endTime}}</p>
          <p><strong>Expected Impact:</strong> {{impact}}</p>
          <p>We apologize for any inconvenience this may cause.</p>
          <p>If you have any questions, please contact us at {{contactEmail}}</p>
          <p>Best regards,<br>ITSM System Team</p>
        `,
        textBody: `
          System Maintenance Notification
          
          Maintenance: {{maintenanceTitle}}
          
          Description:
          {{description}}
          
          Start Time: {{startTime}}
          End Time: {{endTime}}
          Expected Impact: {{impact}}
          
          We apologize for any inconvenience this may cause.
          
          If you have any questions, please contact us at {{contactEmail}}
          
          Best regards,
          ITSM System Team
        `,
        variables: this.getDefaultVariables(EmailTemplateTypeEnum.SYSTEM_MAINTENANCE),
        isActive: true,
      },
    ];

    for (const templateData of defaultTemplates) {
      const template = this.emailTemplateRepository.create(templateData);
      await this.emailTemplateRepository.save(template);
    }
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  private getDefaultVariables(type: EmailTemplateTypeEnum): string[] {
    return EMAIL_TEMPLATE_VARIABLES[type] || [];
  }
} 