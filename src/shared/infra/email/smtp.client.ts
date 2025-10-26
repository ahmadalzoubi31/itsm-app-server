// src/shared/infra/email/smtp.client.ts
import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

export type SmtpOptions = {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  from: string;
  replyTo?: string;
};

export class SmtpClient {
  private transport: nodemailer.Transporter;
  private readonly logger = new Logger(SmtpClient.name);

  constructor(private readonly opts: SmtpOptions) {
    this.logger.log(`Initializing SMTP client for ${opts.host}:${opts.port}`);
    this.logger.debug(
      `SMTP configuration: secure=${opts.secure}, auth=${!!opts.username}`,
    );

    try {
      this.transport = nodemailer.createTransport({
        host: opts.host,
        port: opts.port,
        secure: opts.secure,
        auth: opts.username
          ? { user: opts.username, pass: opts.password }
          : undefined,
      });

      this.logger.log('SMTP transport created successfully');
    } catch (error) {
      this.logger.error('Failed to create SMTP transport', error.stack);
      throw error;
    }
  }
  async verify() {
    try {
      this.logger.debug('Verifying SMTP connection...');
      const result = await this.transport.verify();
      this.logger.log('SMTP connection verified successfully');
      return result;
    } catch (error) {
      this.logger.error('SMTP connection verification failed', error.stack);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async send(to: string, subject: string, html: string) {
    try {
      this.logger.debug(`Sending email to ${to} with subject: ${subject}`);
      const result = await this.transport.sendMail({
        from: this.opts.from,
        to,
        subject,
        html,
        replyTo: this.opts.replyTo,
      });

      this.logger.log(
        `Email sent successfully to ${to} (Message ID: ${result.messageId})`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
