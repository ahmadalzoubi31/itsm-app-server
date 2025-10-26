// src/modules/email/core/senders/email-sender.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailResolverService } from '../resolvers/email-resolver.service';
import { SmtpClient } from '@shared/infra/email/smtp.client';
import { EmailMessage } from '../../entities/email-message.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(
    private resolver: EmailResolverService,
    @InjectRepository(EmailMessage) private emailRepo: Repository<EmailMessage>,
  ) {}

  async sendForBL(blId: string, to: string, subject: string, html: string) {
    this.logger.log(
      `Sending email to ${to} for business line ${blId}: ${subject}`,
    );
    try {
      const ch = await this.resolver.getDefaultSmtp(blId);
      if (!ch || ch.kind !== 'smtp') {
        this.logger.error(
          `No valid SMTP channel found for business line ${blId}`,
        );
        throw new BadRequestException('Only SMTP send is supported');
      }

      this.logger.debug(`Using SMTP channel ${ch.id} to send email`);
      const client = await this.getSmtpClient(blId);
      await client.verify();
      this.logger.debug('SMTP connection verified successfully');

      // Generate unique message ID for tracking
      const messageId = `<${uuidv4()}@${ch.host}>`;

      // Send the email
      this.logger.debug(`Sending email with messageId: ${messageId}`);
      const result = await client.send(to, subject, html);
      this.logger.log(`Email sent successfully to ${to}`);

      // Save outgoing email to database
      const emailMessage = this.emailRepo.create({
        channelId: ch.id,
        messageId: messageId,
        fromAddr: ch.fromAddress,
        toAddrs: [to],
        subject: subject,
        htmlBody: html,
        direction: 'outbound',
      });

      await this.emailRepo.save(emailMessage);
      this.logger.debug(
        `Email message saved to database with id: ${emailMessage.id}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async getSmtpClient(blId: string) {
    const ch = await this.resolver.getDefaultSmtp(blId);
    if (!ch || ch.kind !== 'smtp')
      throw new BadRequestException('Only SMTP send is supported');
    return new SmtpClient({
      host: ch.host,
      port: ch.port,
      secure: ch.secure,
      username: ch.username || undefined,
      password: ch.password || undefined,
      from: ch.fromAddress,
      replyTo: ch.replyTo || undefined,
    });
  }
}
