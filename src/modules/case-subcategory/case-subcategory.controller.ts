// src/modules/case-subcategory/case-subcategory.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CaseSubcategoryService } from './case-subcategory.service';
import { CreateCaseSubcategoryDto } from './dto/create-case-subcategory.dto';
import { UpdateCaseSubcategoryDto } from './dto/update-case-subcategory.dto';
import { CaseSubcategory } from './entities/case-subcategory.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('Case Subcategory')
@ApiBearerAuth('access-token')
@Controller('case-subcategories')
@UseGuards(JwtAuthGuard)
export class CaseSubcategoryController {
  private readonly logger = new Logger(CaseSubcategoryController.name);

  constructor(private readonly caseSubcategoryService: CaseSubcategoryService) {
    this.logger.log('CaseSubcategoryController initialized');
  }

  @ApiOperation({
    summary: 'List all case subcategories',
    description: 'Get all active case subcategories, optionally filtered by category',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter subcategories by category ID',
  })
  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, CaseSubcategory)
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.caseSubcategoryService.findByCategoryId(categoryId);
    }
    return this.caseSubcategoryService.findAll();
  }

  @ApiOperation({
    summary: 'Get case subcategory by ID',
    description: 'Retrieve a specific case subcategory with its category',
  })
  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseSubcategoryService, 'findOne')
  findOne(@Param('id') id: string) {
    return this.caseSubcategoryService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create case subcategory',
    description: 'Admin: Create a new case subcategory',
  })
  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, CaseSubcategory)
  create(@Body() dto: CreateCaseSubcategoryDto) {
    return this.caseSubcategoryService.create(dto);
  }

  @ApiOperation({
    summary: 'Update case subcategory',
    description: 'Admin: Update an existing case subcategory',
  })
  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseSubcategoryService, 'findOne')
  update(@Param('id') id: string, @Body() dto: UpdateCaseSubcategoryDto) {
    return this.caseSubcategoryService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Deactivate case subcategory',
    description: 'Admin: Soft delete a case subcategory',
  })
  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Delete, CaseSubcategoryService, 'findOne')
  deactivate(@Param('id') id: string) {
    return this.caseSubcategoryService.deactivate(id);
  }
}

