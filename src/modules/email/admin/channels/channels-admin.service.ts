// src/modules/email/admin/channels/channels-admin.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailChannel } from '../../entities/email-channel.entity';
import { CreateEmailChannelDto } from '../../dto/create-email-channel.dto';
import { UpdateEmailChannelDto } from '../../dto/update-email-channel.dto';
import { SmtpClient } from '@shared/infra/email/smtp.client';
import { EmailIngestWorker } from '../../core/workers/email-ingest.worker';

@Injectable()
export class ChannelsAdminService {
  private readonly logger = new Logger(ChannelsAdminService.name);

  constructor(
    @InjectRepository(EmailChannel) private ch: Repository<EmailChannel>,
    private readonly ingestWorker: EmailIngestWorker,
  ) {}

  async list() {
    this.logger.debug('Listing all email channels');
    const channels = await this.ch.find({ order: { updatedAt: 'DESC' } });
    this.logger.log(`Found ${channels.length} email channels`);
    return channels;
  }

  async create(dto: CreateEmailChannelDto) {
    this.logger.log(
      `Creating email channel for business line ${dto.businessLineId}`,
    );
    if (dto.isDefault && dto.kind !== 'smtp')
      throw new BadRequestException('Only SMTP can be default');
    if (dto.isDefault) {
      this.logger.debug(
        `Clearing default channel for business line ${dto.businessLineId}`,
      );
      await this.clearDefault(dto.businessLineId);
    }
    const row = this.ch.create({ ...dto });
    const saved = await this.ch.save(row);
    this.logger.log(`Email channel created successfully with id: ${saved.id}`);
    return saved;
  }

  async update(id: string, dto: UpdateEmailChannelDto) {
    this.logger.debug(`Updating email channel ${id}`);
    const existing = await this.ch.findOneByOrFail({ id });
    if (dto.isDefault && (dto.kind ?? existing.kind) !== 'smtp')
      throw new BadRequestException('Only SMTP can be default');
    if (dto.isDefault) {
      this.logger.debug(
        `Clearing default channel for business line ${existing.businessLineId}`,
      );
      await this.clearDefault(existing.businessLineId);
    }
    Object.assign(existing, dto);
    const saved = await this.ch.save(existing);
    this.logger.log(`Email channel ${id} updated successfully`);
    return saved;
  }

  async remove(id: string) {
    this.logger.warn(`Deleting email channel ${id}`);
    const result = await this.ch.delete(id);
    this.logger.log(`Email channel ${id} deleted successfully`);
    return result;
  }

  private async clearDefault(businessLineId: string) {
    // Find all default SMTP channels for this business line
    const defaultChannels = await this.ch.find({
      where: {
        businessLineId,
        kind: 'smtp',
        isDefault: true,
      },
    });

    // Update each channel individually to trigger audit subscriber
    for (const channel of defaultChannels) {
      channel.isDefault = false;
      await this.ch.save(channel);
    }
  }

  async testConnection(id: string) {
    this.logger.debug(`Testing connection for channel ${id}`);
    const ch = await this.ch.findOneByOrFail({ id });
    if (ch.kind !== 'smtp') {
      this.logger.warn(`Attempted to test non-SMTP channel ${id}`);
      throw new BadRequestException('Only SMTP test is supported');
    }
    const client = await this.getSmtpClient(id);
    await client.verify();
    this.logger.log(`SMTP connection test successful for channel ${id}`);
    return { ok: true };
  }

  private async getSmtpClient(blId: string) {
    const ch = await this.ch.findOneByOrFail({ id: blId });
    if (ch.kind !== 'smtp')
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

  async simulateIncomingEmail(
    channelId: string,
    dto: {
      messageId: string;
      from: string;
      to: string[];
      subject: string;
      text?: string;
      html?: string;
      inReplyTo?: string;
      references?: string[];
    },
  ) {
    this.logger.log(
      `Simulating incoming email on channel ${channelId} from ${dto.from}`,
    );
    this.logger.debug(
      `Message details - ID: ${dto.messageId}, Subject: ${dto.subject}`,
    );
    const channel = await this.ch.findOneByOrFail({ id: channelId });
    return await this.ingestWorker.processMessage(channel, dto);
  }
}
