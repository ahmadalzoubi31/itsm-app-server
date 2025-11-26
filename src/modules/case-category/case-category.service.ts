// src/modules/case-category/case-category.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseCategory } from './entities/case-category.entity';
import { CreateCaseCategoryDto } from './dto/create-case-category.dto';
import { UpdateCaseCategoryDto } from './dto/update-case-category.dto';

@Injectable()
export class CaseCategoryService {
  constructor(
    @InjectRepository(CaseCategory)
    private readonly caseCategoryRepo: Repository<CaseCategory>,
  ) {}

  /**
   * List all case categories (both active and inactive)
   */
  async findAll(): Promise<CaseCategory[]> {
    return this.caseCategoryRepo.find({
      order: { active: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a single case category by ID
   */
  async findOne(id: string): Promise<CaseCategory> {
    const caseCategory = await this.caseCategoryRepo.findOne({
      where: { id },
      relations: ['subcategories'],
    });

    if (!caseCategory) {
      throw new NotFoundException(`Case category with ID ${id} not found`);
    }

    return caseCategory;
  }

  /**
   * Find case category by key
   */
  async findByKey(key: string): Promise<CaseCategory | null> {
    return this.caseCategoryRepo.findOne({ where: { key } });
  }

  /**
   * Create a new case category
   */
  async create(dto: CreateCaseCategoryDto): Promise<CaseCategory> {
    const caseCategory = this.caseCategoryRepo.create(dto);

    return this.caseCategoryRepo.save(caseCategory);
  }

  /**
   * Update an existing case category
   */
  async update(id: string, dto: UpdateCaseCategoryDto): Promise<CaseCategory> {
    const caseCategory = await this.findOne(id);

    Object.assign(caseCategory, dto);

    return this.caseCategoryRepo.save(caseCategory);
  }

  /**
   * Soft delete (deactivate) a case category
   */
  async deactivate(id: string): Promise<CaseCategory> {
    return this.update(id, { active: false });
  }
}

