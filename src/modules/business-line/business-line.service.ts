// src/modules/business-line/business-line.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLine } from './entities/business-line.entity';
import { CreateBusinessLineDto } from './dto/create-business-line.dto';
import { UpdateBusinessLineDto } from './dto/update-business-line.dto';

@Injectable()
export class BusinessLineService {
  constructor(
    @InjectRepository(BusinessLine)
    private readonly businessLineRepo: Repository<BusinessLine>,
  ) {}

  /**
   * List all business lines (both active and inactive)
   */
  async findAll(): Promise<BusinessLine[]> {
    return this.businessLineRepo.find({
      order: { active: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a single business line by ID
   */
  async findOne(id: string): Promise<BusinessLine> {
    const businessLine = await this.businessLineRepo.findOne({
      where: { id },
    });

    if (!businessLine) {
      throw new NotFoundException(`Business line with ID ${id} not found`);
    }

    return businessLine;
  }

  /**
   * Find business line by key
   */
  async findByKey(key: string): Promise<BusinessLine | null> {
    return this.businessLineRepo.findOne({ where: { key } });
  }

  /**
   * Create a new business line
   */
  async create(dto: CreateBusinessLineDto): Promise<BusinessLine> {
    const businessLine = this.businessLineRepo.create(dto);

    return this.businessLineRepo.save(businessLine);
  }

  /**
   * Update an existing business line
   */
  async update(id: string, dto: UpdateBusinessLineDto): Promise<BusinessLine> {
    const businessLine = await this.findOne(id);

    Object.assign(businessLine, dto);

    return this.businessLineRepo.save(businessLine);
  }

  /**
   * Soft delete (deactivate) a business line
   */
  async deactivate(id: string): Promise<BusinessLine> {
    return this.update(id, { active: false });
  }
}
