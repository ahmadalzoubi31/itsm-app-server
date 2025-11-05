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
import { CasePriority } from '@shared/constants';
import { CreateCaseDto } from '@modules/case/dto/create-case.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { RequestService } from '@modules/request/request.service';
import { RequestType } from '@shared/constants';
import { CreateServiceDto } from './dto/create-service.dto';

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
    private readonly requestSvc: RequestService,
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
  async createService(dto: CreateServiceDto) {
    // Validate business line exists (required field)
    if (!dto.businessLineId) {
      throw new BadRequestException('businessLineId is required');
    }
    await this.businessLineSvc.findOne(dto.businessLineId);

    const service = this.services.create(dto);
    return this.services.save(service);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const template = await this.templates.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    // Validate business line if updating
    if (dto.businessLineId) {
      await this.businessLineSvc.findOne(dto.businessLineId);
    }

    return this.templates.save({
      ...template,
      ...dto,
    });
  }

  async createTemplate(dto: CreateTemplateDto) {
    // minimal checks
    // if (!dto.serviceId) throw new BadRequestException('serviceId required');
    // if (!dto.businessLineId) throw new BadRequestException('businessLineId required');

    // Validate business line exists
    // await this.businessLineSvc.findOne(dto.businessLineId);

    const template = this.templates.create({
      ...dto,
    });
    return this.templates.save(template);
  }

  /**
   * Submit a request from a catalog template
   */
  async submitRequest(templateId: string, formData: Record<string, any>) {
    // 1. Get and validate template
    const template = await this.templates.findOne({
      where: { id: templateId, active: true },
      relations: ['businessLine'],
    });
    if (!template) {
      throw new NotFoundException('Template not found or inactive');
    }

    // 2. Validate form data against jsonSchema
    const validate = ajv.compile(template.jsonSchema);
    const valid = validate(formData);

    if (!valid) {
      throw new BadRequestException({
        message: 'Form validation failed',
        errors: validate.errors,
      });
    }

    // 3. Merge defaults
    const finalData = { ...template.defaults, ...formData };

    // 4. Build title from template name + key data
    const titlePrefix = template.name;
    const title = `${titlePrefix} - ${JSON.stringify(finalData).slice(0, 50)}`;

    // 5. Get service
    const service = await this.services.findOne({
      where: { id: template.serviceId },
      relations: ['businessLine'],
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 6. Determine priority from form data
    const priority = this.determinePriority(finalData);

    // 7. Create Request (which will route to Case/Incident via workflow)
    const request = await this.requestSvc.createRequest({
      title,
      description: `Request from catalog: ${template.name}. Data: ${JSON.stringify(finalData)}`,
      type: RequestType.SERVICE_REQUEST,
      priority,
      businessLineId: template.businessLineId,
      affectedServiceId: service.id,
      requestTemplateId: templateId,
      metadata: finalData, // Store form data in metadata
    });

    return request;
  }

  /**
   * Determine priority from form data (look for urgency field)
   */
  private determinePriority(data: Record<string, any>): CasePriority {
    const urgency = data.urgency?.toLowerCase() || 'medium';
    const mapping: Record<string, CasePriority> = {
      low: CasePriority.LOW,
      medium: CasePriority.MEDIUM,
      high: CasePriority.HIGH,
      critical: CasePriority.CRITICAL,
    };
    return mapping[urgency] || CasePriority.MEDIUM;
  }
}
