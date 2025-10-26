// src/modules/catalog/catalog.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Service } from './entities/service.entity';
import { RequestTemplate } from './entities/request-template.entity';
import { CaseService } from '@modules/case/case.service';
import { BusinessLineService } from '@modules/business-line/business-line.service';

const ajv = addFormats(
  new Ajv({ allErrors: true, removeAdditional: 'failing' }),
);

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Service) private services: Repository<Service>,
    @InjectRepository(RequestTemplate)
    private templates: Repository<RequestTemplate>,
    private readonly caseSvc: CaseService,
    private readonly businessLineSvc: BusinessLineService,
  ) {}

  // browse
  listServices() {
    return this.services.find({ order: { name: 'ASC' } });
  }
  listTemplatesByService(serviceId: string) {
    return this.templates.find({
      where: { serviceId, active: true },
      order: { name: 'ASC' },
    });
  }
  async getTemplate(id: string) {
    const t = await this.templates.findOne({ where: { id, active: true } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  // admin
  async createService(dto: Partial<Service>) {
    // Validate business line exists (required field)
    if (!dto.businessLineId) {
      throw new BadRequestException('businessLineId is required');
    }
    await this.businessLineSvc.findOne(dto.businessLineId);

    const service = this.services.create(dto);
    return this.services.save(service);
  }
  updateTemplate(id: string, dto: Partial<RequestTemplate>) {
    return this.templates.update(id, dto);
  }
  async createTemplate(dto: Partial<RequestTemplate>) {
    // minimal checks
    if (!dto.serviceId) throw new BadRequestException('serviceId required');
    const template = this.templates.create(dto);
    return this.templates.save(template);
  }
}
