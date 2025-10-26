// src/modules/email/admin/rules/rules-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailRoutingRule } from '../../entities/email-routing-rule.entity';
import { CreateEmailRoutingRuleDto } from '../../dto/create-email-routing-rule.dto';
import { UpdateEmailRoutingRuleDto } from '../../dto/update-email-routing-rule.dto';

@Injectable()
export class RulesAdminService {
  private readonly logger = new Logger(RulesAdminService.name);

  constructor(
    @InjectRepository(EmailRoutingRule)
    private repo: Repository<EmailRoutingRule>,
  ) {}

  async list() {
    this.logger.debug('Listing all email routing rules');
    const rules = await this.repo.find({ order: { id: 'ASC' } });
    this.logger.log(`Found ${rules.length} routing rules`);
    return rules;
  }

  async create(dto: CreateEmailRoutingRuleDto) {
    this.logger.log(
      `Creating email routing rule for business line ${dto.businessLineId}`,
    );
    const saved = await this.repo.save(dto);
    this.logger.log(`Routing rule created successfully with id: ${saved.id}`);
    return saved;
  }

  async update(id: string, dto: UpdateEmailRoutingRuleDto) {
    this.logger.debug(`Updating routing rule ${id}`);
    const result = await this.repo.update(id, dto);
    this.logger.log(`Routing rule ${id} updated successfully`);
    return result;
  }

  async remove(id: string) {
    this.logger.warn(`Deleting routing rule ${id}`);
    const result = await this.repo.delete(id);
    this.logger.log(`Routing rule ${id} deleted successfully`);
    return result;
  }
}
