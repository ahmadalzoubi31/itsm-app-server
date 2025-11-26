// src/modules/case-subcategory/case-subcategory.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseSubcategory } from './entities/case-subcategory.entity';
import { CreateCaseSubcategoryDto } from './dto/create-case-subcategory.dto';
import { UpdateCaseSubcategoryDto } from './dto/update-case-subcategory.dto';
import { CaseCategoryService } from '@modules/case-category/case-category.service';

@Injectable()
export class CaseSubcategoryService {
  constructor(
    @InjectRepository(CaseSubcategory)
    private readonly caseSubcategoryRepo: Repository<CaseSubcategory>,
    private readonly caseCategoryService: CaseCategoryService,
  ) {}

  /**
   * List all case subcategories (both active and inactive)
   */
  async findAll(): Promise<CaseSubcategory[]> {
    return this.caseSubcategoryRepo.find({
      relations: ['category'],
      order: { active: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Get a single case subcategory by ID
   */
  async findOne(id: string): Promise<CaseSubcategory> {
    const caseSubcategory = await this.caseSubcategoryRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!caseSubcategory) {
      throw new NotFoundException(`Case subcategory with ID ${id} not found`);
    }

    return caseSubcategory;
  }

  /**
   * Find case subcategory by key and category
   */
  async findByKey(key: string, categoryId: string): Promise<CaseSubcategory | null> {
    return this.caseSubcategoryRepo.findOne({
      where: { key, categoryId },
      relations: ['category'],
    });
  }

  /**
   * Find all subcategories by category ID
   */
  async findByCategoryId(categoryId: string): Promise<CaseSubcategory[]> {
    return this.caseSubcategoryRepo.find({
      where: { categoryId },
      relations: ['category'],
      order: { active: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Create a new case subcategory
   */
  async create(dto: CreateCaseSubcategoryDto): Promise<CaseSubcategory> {
    // Verify that the category exists
    const category = await this.caseCategoryService.findOne(dto.categoryId);
    if (!category) {
      throw new BadRequestException(`Case category with ID ${dto.categoryId} not found`);
    }

    // Check if a subcategory with the same key already exists for this category
    const existing = await this.findByKey(dto.key, dto.categoryId);
    if (existing) {
      throw new BadRequestException(
        `Case subcategory with key "${dto.key}" already exists for this category`,
      );
    }

    const caseSubcategory = this.caseSubcategoryRepo.create(dto);

    return this.caseSubcategoryRepo.save(caseSubcategory);
  }

  /**
   * Update an existing case subcategory
   */
  async update(id: string, dto: UpdateCaseSubcategoryDto): Promise<CaseSubcategory> {
    const caseSubcategory = await this.findOne(id);

    // If categoryId is being updated, verify the new category exists
    if (dto.categoryId && dto.categoryId !== caseSubcategory.categoryId) {
      const category = await this.caseCategoryService.findOne(dto.categoryId);
      if (!category) {
        throw new BadRequestException(`Case category with ID ${dto.categoryId} not found`);
      }

      // Check if a subcategory with the same key already exists for the new category
      const existing = await this.findByKey(caseSubcategory.key, dto.categoryId);
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Case subcategory with key "${caseSubcategory.key}" already exists for this category`,
        );
      }
    }

    Object.assign(caseSubcategory, dto);

    return this.caseSubcategoryRepo.save(caseSubcategory);
  }

  /**
   * Soft delete (deactivate) a case subcategory
   */
  async deactivate(id: string): Promise<CaseSubcategory> {
    return this.update(id, { active: false });
  }
}

