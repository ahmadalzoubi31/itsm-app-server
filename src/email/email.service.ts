import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { EmailQueue } from './entities/email-queue.entity';
import { EmailStatistics } from './entities/email-statistics.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { 
  SendEmailDto, 
  TestEmailDto, 
  SendTemplateEmailDto,
  EmailSettingsDto,
  OutgoingEmailEngineDto,
  IncomingEmailEngineDto,
  NotificationSettingsDto
} from './dto';
import { 
  EmailQueueStatusEnum, 
  EmailPriorityEnum, 
  EmailProtocolEnum,
  NotificationTypeEnum 
} from './enums';
import { SettingTypeEnum } from '../settings/constants/type.constant';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(EmailQueue)
    private emailQueueRepository: Repository<EmailQueue>,
    @InjectRepository(EmailStatistics)
    private emailStatisticsRepository: Repository<EmailStatistics>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    private settingsService: SettingsService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      const settings = await this.getEmailSettings();
      console.log("🚀 ~ initializeTransporter ~ settings:", settings)
      if (settings?.outgoing?.enabled) {
        this.transporter = await this.createTransporter(settings.outgoing);
        this.logger.log('Email transporter initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  async createTransporter(outgoingSettings: OutgoingEmailEngineDto): Promise<nodemailer.Transporter> {
    const transportOptions = {
      host: outgoingSettings.host,
      port: outgoingSettings.port,
      secure: outgoingSettings.secure,
      auth: {
        user: outgoingSettings.username,
        pass: outgoingSettings.password,
      },
      connectionTimeout: outgoingSettings.connectionTimeout,
      greetingTimeout: outgoingSettings.timeout,
      socketTimeout: outgoingSettings.timeout,
      pool: true,
      maxConnections: outgoingSettings.maxConnections,
      rateDelta: 1000,
      rateLimit: outgoingSettings.rateLimitPerSecond,
    };

    return createTransport(transportOptions);
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter not configured');
        }
      }

      const emailSettings = await this.getEmailSettings();
      const outgoingSettings = emailSettings?.outgoing;
      
      if (!outgoingSettings?.enabled) {
        throw new Error('Outgoing email engine is not enabled');
      }

      const fromName = outgoingSettings.fromName || 'ITSM System';
      const fromEmail = outgoingSettings.fromEmail || this.configService.get('DEFAULT_FROM_EMAIL');
      
      if (!fromEmail) {
        throw new Error('From email address is required');
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: fromName,
          address: fromEmail,
        },
        to: sendEmailDto.recipients,
        cc: sendEmailDto.cc,
        bcc: sendEmailDto.bcc,
        subject: sendEmailDto.subject,
        html: sendEmailDto.htmlBody,
        text: sendEmailDto.textBody,
        attachments: sendEmailDto.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        })),
        priority: sendEmailDto.priority?.toLowerCase() as any,
        replyTo: outgoingSettings.replyTo,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Update statistics
      await this.updateEmailStatistics('sent');
      
      // Emit event for successful send
      this.eventEmitter.emit('email.sent', {
        messageId: result.messageId || 'unknown',
        recipients: sendEmailDto.recipients,
        subject: sendEmailDto.subject,
      });

      return {
        success: true,
        messageId: result.messageId || 'unknown',
      };

    } catch (error) {
      this.logger.error('Failed to send email:', error);
      
      // Update statistics
      await this.updateEmailStatistics('failed');
      
      // Emit event for failed send
      this.eventEmitter.emit('email.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipients: sendEmailDto.recipients,
        subject: sendEmailDto.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async queueEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    const queueItem = this.emailQueueRepository.create({
      recipients: sendEmailDto.recipients,
      cc: sendEmailDto.cc?.join(','),
      bcc: sendEmailDto.bcc?.join(','),
      subject: sendEmailDto.subject,
      htmlBody: sendEmailDto.htmlBody,
      textBody: sendEmailDto.textBody,
      priority: sendEmailDto.priority || EmailPriorityEnum.MEDIUM,
      attachments: sendEmailDto.attachments,
      templateId: sendEmailDto.templateId,
      templateData: sendEmailDto.templateData,
      scheduledAt: sendEmailDto.scheduledAt,
      status: EmailQueueStatusEnum.PENDING,
    });

    return this.emailQueueRepository.save(queueItem);
  }

  async sendTemplateEmail(dto: SendTemplateEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id: dto.templateId, isActive: true },
    });

    if (!template) {
      throw new Error('Email template not found or inactive');
    }

    // Process template variables
    const processedSubject = this.processTemplate(template.subject, dto.templateData);
    const processedHtmlBody = this.processTemplate(template.htmlBody, dto.templateData);
    const processedTextBody = this.processTemplate(template.textBody, dto.templateData);

    const sendEmailDto: SendEmailDto = {
      recipients: dto.recipients,
      cc: dto.cc,
      bcc: dto.bcc,
      subject: processedSubject,
      htmlBody: processedHtmlBody,
      textBody: processedTextBody,
      priority: dto.priority,
      templateId: dto.templateId,
      templateData: dto.templateData,
      scheduledAt: dto.scheduledAt,
    };

    if (dto.scheduledAt && dto.scheduledAt > new Date()) {
      // Queue for later delivery
      await this.queueEmail(sendEmailDto);
      return { success: true, messageId: 'queued' };
    } else {
      // Send immediately
      return this.sendEmail(sendEmailDto);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.transporter) {
        console.log("🚀 ~ testConnection ~ this.transporter:", this.transporter)
        await this.initializeTransporter();
        if (!this.transporter) {
          return {
            success: false,
            message: 'Email transporter not configured. Please check your email engine settings.',
          };
        }
      }

      const startTime = Date.now();      
      await this.transporter.verify();
      const duration = Date.now() - startTime;

      return {
        success: true,
        message: 'Email connection test successful',
        details: { duration },
      };

    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return {
        success: false,
        message: 'Email connection test failed',
        details: { error: error.message },
      };
    }
  }

  async sendTestEmail(dto: TestEmailDto): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const sendEmailDto: SendEmailDto = {
        recipients: [dto.to],
        subject: dto.subject,
        htmlBody: dto.isHtml ? dto.body : `<pre>${dto.body}</pre>`,
        textBody: dto.isHtml ? dto.body.replace(/<[^>]*>/g, '') : dto.body,
      };

      const result = await this.sendEmail(sendEmailDto);
      
      if (result.success) {
        return {
          success: true,
          message: 'Test email sent successfully',
          details: { messageId: result.messageId },
        };
      } else {
        return {
          success: false,
          message: 'Failed to send test email',
          details: { error: result.error },
        };
      }

    } catch (error) {
      this.logger.error('Test email failed:', error);
      return {
        success: false,
        message: 'Test email failed',
        details: { error: error.message },
      };
    }
  }

  async sendNotification(type: NotificationTypeEnum, data: any): Promise<void> {
    const notificationSettings = await this.getNotificationSettings();
    
    if (!notificationSettings?.enabled || !notificationSettings.notificationTypes.includes(type)) {
      return;
    }

    const recipients = this.getRecipientsForNotification(type, notificationSettings, data);
    if (recipients.length === 0) return;

    const template = await this.getTemplateForNotificationType(type);
    if (!template) {
      this.logger.warn(`No template found for notification type: ${type}`);
      return;
    }

    await this.sendTemplateEmail({
      recipients,
      templateId: template.id,
      templateData: data,
      priority: this.getPriorityForNotificationType(type),
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processEmailQueue(): Promise<void> {
    const pendingEmails = await this.emailQueueRepository.find({
      where: [
        { status: EmailQueueStatusEnum.PENDING },
        { status: EmailQueueStatusEnum.RETRYING },
      ],
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: 50, // Process up to 50 emails per minute
    });

    for (const email of pendingEmails) {
      if (email.scheduledAt && email.scheduledAt > new Date()) {
        continue; // Skip scheduled emails that aren't ready
      }

      await this.processQueuedEmail(email);
    }
  }

  private async processQueuedEmail(email: EmailQueue): Promise<void> {
    try {
      email.status = EmailQueueStatusEnum.PROCESSING;
      email.lastAttemptAt = new Date();
      await this.emailQueueRepository.save(email);

      const sendEmailDto: SendEmailDto = {
        recipients: email.recipients,
        cc: email.cc ? email.cc.split(',') : undefined,
        bcc: email.bcc ? email.bcc.split(',') : undefined,
        subject: email.subject,
        htmlBody: email.htmlBody,
        textBody: email.textBody,
        attachments: email.attachments,
      };

      const result = await this.sendEmail(sendEmailDto);

      if (result.success) {
        email.status = EmailQueueStatusEnum.SENT;
        email.sentAt = new Date();
        email.messageId = result.messageId || 'unknown';
      } else {
        email.attempts++;
        email.errorMessage = result.error || 'Unknown error';
        
        if (email.attempts >= email.maxAttempts) {
          email.status = EmailQueueStatusEnum.FAILED;
        } else {
          email.status = EmailQueueStatusEnum.RETRYING;
        }
      }

    } catch (error) {
      email.attempts++;
      email.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      email.status = email.attempts >= email.maxAttempts 
        ? EmailQueueStatusEnum.FAILED 
        : EmailQueueStatusEnum.RETRYING;
    }

    await this.emailQueueRepository.save(email);
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private getRecipientsForNotification(
    type: NotificationTypeEnum, 
    settings: NotificationSettingsDto, 
    data: any
  ): string[] {
    const recipients = [...settings.defaultRecipients];
    
    // Add urgent recipients for high priority notifications
    const urgentTypes = [
      NotificationTypeEnum.INCIDENT_CREATED,
      NotificationTypeEnum.SYSTEM_ALERT,
    ];
    
    if (urgentTypes.includes(type) || data.priority === 'critical') {
      recipients.push(...settings.urgentRecipients);
    }

    return [...new Set(recipients)]; // Remove duplicates
  }

  private getPriorityForNotificationType(type: NotificationTypeEnum): EmailPriorityEnum {
    const priorityMap = {
      [NotificationTypeEnum.SYSTEM_ALERT]: EmailPriorityEnum.CRITICAL,
      [NotificationTypeEnum.INCIDENT_CREATED]: EmailPriorityEnum.HIGH,
      [NotificationTypeEnum.INCIDENT_UPDATED]: EmailPriorityEnum.MEDIUM,
      [NotificationTypeEnum.INCIDENT_RESOLVED]: EmailPriorityEnum.MEDIUM,
      [NotificationTypeEnum.SERVICE_REQUEST_CREATED]: EmailPriorityEnum.LOW,
      [NotificationTypeEnum.SERVICE_REQUEST_APPROVED]: EmailPriorityEnum.MEDIUM,
      [NotificationTypeEnum.SERVICE_REQUEST_REJECTED]: EmailPriorityEnum.MEDIUM,
      [NotificationTypeEnum.USER_CREATED]: EmailPriorityEnum.LOW,
      [NotificationTypeEnum.LDAP_SYNC_STATUS]: EmailPriorityEnum.LOW,
    };

    return priorityMap[type] || EmailPriorityEnum.MEDIUM;
  }

  private async getTemplateForNotificationType(type: NotificationTypeEnum): Promise<EmailTemplate | null> {
    const templateTypeMap = {
      [NotificationTypeEnum.INCIDENT_CREATED]: 'INCIDENT_NOTIFICATION',
      [NotificationTypeEnum.INCIDENT_UPDATED]: 'INCIDENT_NOTIFICATION',
      [NotificationTypeEnum.INCIDENT_RESOLVED]: 'INCIDENT_NOTIFICATION',
      [NotificationTypeEnum.SERVICE_REQUEST_CREATED]: 'SERVICE_REQUEST_NOTIFICATION',
      [NotificationTypeEnum.SERVICE_REQUEST_APPROVED]: 'SERVICE_REQUEST_NOTIFICATION',
      [NotificationTypeEnum.SERVICE_REQUEST_REJECTED]: 'SERVICE_REQUEST_NOTIFICATION',
      [NotificationTypeEnum.USER_CREATED]: 'USER_WELCOME',
      [NotificationTypeEnum.SYSTEM_ALERT]: 'SYSTEM_MAINTENANCE',
      [NotificationTypeEnum.LDAP_SYNC_STATUS]: 'SYSTEM_MAINTENANCE',
    };

    const templateType = templateTypeMap[type];
    if (!templateType) return null;

    return this.emailTemplateRepository.findOne({
      where: { type: templateType as any, isActive: true },
    });
  }

  private async updateEmailStatistics(type: 'sent' | 'failed'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let stats = await this.emailStatisticsRepository.findOne({
      where: { date: today },
    });

    if (!stats) {
      stats = this.emailStatisticsRepository.create({
        date: today,
        totalSent: 0,
        totalFailed: 0,
      });
    }

    if (type === 'sent') {
      stats.totalSent++;
    } else {
      stats.totalFailed++;
    }

    stats.deliveryRate = (stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100;

    await this.emailStatisticsRepository.save(stats);
  }

  async getEmailStatistics(): Promise<any> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      todayStats,
      last7DaysStats,
      lastMonthStats,
      totalStats,
    ] = await Promise.all([
      this.emailStatisticsRepository
        .createQueryBuilder('stats')
        .select('SUM(stats.totalSent)', 'totalSent')
        .addSelect('SUM(stats.totalFailed)', 'totalFailed')
        .where('stats.date >= :yesterday', { yesterday })
        .getRawOne(),
      
      this.emailStatisticsRepository
        .createQueryBuilder('stats')
        .select('SUM(stats.totalSent)', 'totalSent')
        .addSelect('SUM(stats.totalFailed)', 'totalFailed')
        .where('stats.date >= :last7Days', { last7Days })
        .getRawOne(),
      
      this.emailStatisticsRepository
        .createQueryBuilder('stats')
        .select('SUM(stats.totalSent)', 'totalSent')
        .addSelect('SUM(stats.totalFailed)', 'totalFailed')
        .where('stats.date >= :lastMonth', { lastMonth })
        .getRawOne(),
      
      this.emailStatisticsRepository
        .createQueryBuilder('stats')
        .select('SUM(stats.totalSent)', 'totalSent')
        .addSelect('SUM(stats.totalFailed)', 'totalFailed')
        .addSelect('AVG(stats.deliveryRate)', 'deliveryRate')
        .addSelect('AVG(stats.averageDeliveryTime)', 'averageDeliveryTime')
        .getRawOne(),
    ]);

    const lastSent = await this.emailQueueRepository.findOne({
      where: { status: EmailQueueStatusEnum.SENT },
      order: { sentAt: 'DESC' },
    });

    return {
      totalSent: parseInt(totalStats.totalSent) || 0,
      totalFailed: parseInt(totalStats.totalFailed) || 0,
      last24Hours: parseInt(todayStats.totalSent) || 0,
      last7Days: parseInt(last7DaysStats.totalSent) || 0,
      lastMonth: parseInt(lastMonthStats.totalSent) || 0,
      deliveryRate: parseFloat(totalStats.deliveryRate) || 0,
      averageDeliveryTime: parseFloat(totalStats.averageDeliveryTime) || 0,
      lastSentAt: lastSent?.sentAt,
    };
  }

  async getEmailQueue(): Promise<EmailQueue[]> {
    return this.emailQueueRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async clearEmailQueue(): Promise<void> {
    await this.emailQueueRepository.delete({
      status: EmailQueueStatusEnum.PENDING,
    });
  }

  async retryFailedEmails(): Promise<{ retried: number }> {
    const failedEmails = await this.emailQueueRepository.find({
      where: { status: EmailQueueStatusEnum.FAILED },
    });

    for (const email of failedEmails) {
      email.status = EmailQueueStatusEnum.PENDING;
      email.attempts = 0;
      email.errorMessage = '';
    }

    await this.emailQueueRepository.save(failedEmails);

    return { retried: failedEmails.length };
  }

  private async getEmailSettings(): Promise<EmailSettingsDto | null> {
    try {
      const result = await this.settingsService.getByType(SettingTypeEnum.EMAIL as any);
      return result;
    } catch (error) {
      return null;
    }
  }

  private async getNotificationSettings(): Promise<NotificationSettingsDto | null> {
    try {
      const emailSettings = await this.getEmailSettings();
      return emailSettings?.notifications || null;
    } catch (error) {
      return null;
    }
  }
} 