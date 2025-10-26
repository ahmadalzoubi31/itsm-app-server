// src/modules/email/core/template/template.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import * as Handlebars from 'handlebars';
import { CreateNotificationTemplateDto } from '../../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../../dto/update-notification-template.dto';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private cache = new Map<string, NotificationTemplate>();

  constructor(
    @InjectRepository(NotificationTemplate)
    private repo: Repository<NotificationTemplate>,
  ) {}

  async render(blId: string, key: string, ctx: any) {
    this.logger.debug(`Rendering template '${key}' for business line ${blId}`);
    const k = `${blId}:${key}`;
    let t = this.cache.get(k);
    if (!t) {
      this.logger.debug(
        `Template '${key}' not in cache, fetching from database`,
      );
      t = (await this.repo.findOne({
        where: { businessLineId: blId, key },
      })) as NotificationTemplate;
      if (!t) {
        this.logger.error(`Template missing: ${key} for business line ${blId}`);
        throw new Error(`Template missing: ${key} for BL=${blId}`);
      }
      this.cache.set(k, t);
      this.logger.debug(`Template '${key}' added to cache`);
    } else {
      this.logger.debug(`Template '${key}' found in cache`);
    }
    const subject = Handlebars.compile(t.subject)(ctx);
    const html = Handlebars.compile(t.bodyHtml)(ctx);
    this.logger.debug(`Template '${key}' rendered successfully`);
    return { subject, html };
  }

  invalidate(blId: string, key: string) {
    this.logger.debug(
      `Invalidating template cache for '${key}' in business line ${blId}`,
    );
    this.cache.delete(`${blId}:${key}`);
  }

  async create(
    dto: CreateNotificationTemplateDto & {
      createdById: string;
      createdByName: string;
    },
  ) {
    this.logger.debug(
      `Creating template '${dto.key}' for business line ${dto.businessLineId}`,
    );
    const saved = await this.repo.save({
      ...dto,
      createdById: dto.createdById!,
      createdByName: dto.createdByName!,
    });
    this.logger.log(`Template created successfully with id: ${saved.id}`);
    this.invalidate(dto.businessLineId, dto.key);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateNotificationTemplateDto & {
      updatedById: string;
      updatedByName: string;
    },
  ) {
    this.logger.debug(`Updating template ${id}`);
    const tpl = await this.repo.findOneByOrFail({ id });
    const saved = await this.repo.save({
      ...tpl,
      ...dto,
      updatedById: dto.updatedById!,
      updatedByName: dto.updatedByName!,
    });
    this.logger.log(`Template ${id} updated successfully`);
    this.invalidate(tpl.businessLineId, tpl.key);
    return saved;
  }
}
