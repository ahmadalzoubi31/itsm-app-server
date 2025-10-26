// src/modules/email/core/resolvers/email-resolver.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailChannel } from '../../entities/email-channel.entity';

@Injectable()
export class EmailResolverService {
  private readonly logger = new Logger(EmailResolverService.name);

  constructor(
    @InjectRepository(EmailChannel) private ch: Repository<EmailChannel>,
  ) {}

  async getDefaultSmtp(businessLineId: string) {
    this.logger.debug(
      `Resolving default SMTP channel for business line ${businessLineId}`,
    );
    const channel = await this.ch.findOne({
      where: {
        businessLine: { id: businessLineId },
        kind: 'smtp',
        enabled: true,
        isDefault: true,
      },
    });
    if (channel) {
      this.logger.log(
        `Found default SMTP channel ${channel.id} for business line ${businessLineId}`,
      );
    } else {
      this.logger.warn(
        `No default SMTP channel found for business line ${businessLineId}`,
      );
    }
    return channel;
  }
}
