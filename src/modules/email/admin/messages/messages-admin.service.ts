// src/modules/email/admin/messages/messages-admin.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailMessage } from '../../entities/email-message.entity';

@Injectable()
export class MessagesAdminService {
  private readonly logger = new Logger(MessagesAdminService.name);

  constructor(
    @InjectRepository(EmailMessage)
    private readonly msgRepo: Repository<EmailMessage>,
  ) {}

  async list(options?: { direction?: 'inbound' | 'outbound'; limit?: number }) {
    this.logger.debug('Listing email messages');

    const where: any = {};
    if (options?.direction) {
      where.direction = options.direction;
      this.logger.debug(`Filtering by direction: ${options.direction}`);
    }

    const limit = options?.limit || 50;
    const messages = await this.msgRepo.find({
      where,
      relations: ['channel', 'case'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    this.logger.log(`Found ${messages.length} email messages`);
    return messages;
  }

  async findOne(id: string) {
    this.logger.debug(`Finding email message ${id}`);
    const message = await this.msgRepo.findOne({
      where: { id },
      relations: ['channel', 'case'],
    });

    if (!message) {
      this.logger.warn(`Email message ${id} not found`);
      throw new NotFoundException(`Email message ${id} not found`);
    }

    return message;
  }

  async findByCaseId(caseId: string) {
    this.logger.debug(`Finding email messages for case ${caseId}`);
    const messages = await this.msgRepo.find({
      where: { caseId },
      relations: ['channel', 'case'],
      order: { createdAt: 'DESC' },
    });
    this.logger.log(`Found ${messages.length} messages for case ${caseId}`);
    return messages;
  }
}
