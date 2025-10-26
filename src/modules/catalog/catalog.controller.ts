// src/modules/catalog/catalog.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CatalogService } from './catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { CurrentUser } from '@modules/iam/decorators/current-user.decorator';

@ApiTags('Catalog')
@ApiBearerAuth('access-token')
@Controller('catalog')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  // Public browse (authenticated)
  @ApiOperation({
    summary: 'List services',
    description: 'List available services.',
  })
  @Get('services')
  listServices() {
    return this.svc.listServices();
  }

  @ApiOperation({
    summary: 'List templates by service',
    description: 'Templates for a service.',
  })
  @Get('services/:id/templates')
  listTemplatesByService(@Param('id') id: string) {
    return this.svc.listTemplatesByService(id);
  }

  @ApiOperation({
    summary: 'Get template',
    description: 'Get a single request template.',
  })
  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.svc.getTemplate(id);
  }

  // Admin manage
  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create service',
    description: 'Admin: create a service.',
  })
  @Post('services')
  createService(@CurrentUser() user, @Body() dto: CreateServiceDto) {
    return this.svc.createService({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create template',
    description: 'Admin: create a request template.',
  })
  @Post('templates')
  createTemplate(@CurrentUser() user, @Body() dto: CreateTemplateDto) {
    return this.svc.createTemplate({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Update template',
    description: 'Admin: update a request template.',
  })
  @Patch('templates/:id')
  updateTemplate(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.svc.updateTemplate(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }
}
