// src/modules/email/admin/templates/templates-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import { CreateNotificationTemplateDto } from '../../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../../dto/update-notification-template.dto';
import { TemplateService } from '../../core/template/template.service';

@Injectable()
export class TemplatesAdminService {
  private readonly logger = new Logger(TemplatesAdminService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private repo: Repository<NotificationTemplate>,
    private readonly templateService: TemplateService,
  ) {}

  async list() {
    this.logger.debug('Listing all notification templates');
    const templates = await this.repo.find({ order: { updatedAt: 'DESC' } });
    this.logger.log(`Found ${templates.length} notification templates`);
    return templates;
  }

  async create(
    dto: CreateNotificationTemplateDto & {
      createdById: string;
      createdByName: string;
    },
  ) {
    this.logger.log(
      `Creating notification template '${dto.key}' for business line ${dto.businessLineId}`,
    );
    const saved = await this.templateService.create(dto);
    this.logger.log(`Template created successfully with id: ${saved.id}`);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateNotificationTemplateDto & {
      updatedById: string;
      updatedByName: string;
    },
  ) {
    this.logger.debug(`Updating notification template ${id}`);
    const result = await this.templateService.update(id, dto);
    this.logger.log(`Template ${id} updated successfully`);
    return result;
  }

  async remove(id: string) {
    this.logger.warn(`Deleting notification template ${id}`);
    await this.repo.delete(id);
    this.logger.log(`Template ${id} deleted successfully`);
    return { message: 'Template deleted successfully' };
  }
}
