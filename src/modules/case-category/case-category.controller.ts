// src/modules/case-category/case-category.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CaseCategoryService } from './case-category.service';
import { CreateCaseCategoryDto } from './dto/create-case-category.dto';
import { UpdateCaseCategoryDto } from './dto/update-case-category.dto';
import { CaseCategory } from './entities/case-category.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('Case Category')
@ApiBearerAuth('access-token')
@Controller('case-categories')
@UseGuards(JwtAuthGuard)
export class CaseCategoryController {
  private readonly logger = new Logger(CaseCategoryController.name);

  constructor(private readonly caseCategoryService: CaseCategoryService) {
    this.logger.log('CaseCategoryController initialized');
  }

  @ApiOperation({
    summary: 'List all case categories',
    description: 'Get all active case categories (Incident, Service Request, etc.)',
  })
  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, CaseCategory)
  findAll() {
    return this.caseCategoryService.findAll();
  }

  @ApiOperation({
    summary: 'Get case category by ID',
    description: 'Retrieve a specific case category with its subcategories',
  })
  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseCategoryService, 'findOne')
  findOne(@Param('id') id: string) {
    return this.caseCategoryService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create case category',
    description: 'Admin: Create a new case category',
  })
  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, CaseCategory)
  create(@Body() dto: CreateCaseCategoryDto) {
    return this.caseCategoryService.create(dto);
  }

  @ApiOperation({
    summary: 'Update case category',
    description: 'Admin: Update an existing case category',
  })
  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseCategoryService, 'findOne')
  update(@Param('id') id: string, @Body() dto: UpdateCaseCategoryDto) {
    return this.caseCategoryService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Deactivate case category',
    description: 'Admin: Soft delete a case category',
  })
  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Delete, CaseCategoryService, 'findOne')
  deactivate(@Param('id') id: string) {
    return this.caseCategoryService.deactivate(id);
  }
}

