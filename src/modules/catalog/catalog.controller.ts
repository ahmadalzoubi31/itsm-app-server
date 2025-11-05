// src/modules/catalog/catalog.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
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
import { SubmitCatalogRequestDto } from './dto/submit-catalog-request.dto';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';

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

  @ApiOperation({
    summary: 'Submit request from template',
    description: 'Submit a service request from a catalog template.',
  })
  @Post('templates/:id/submit')
  submitFromTemplate(
    @Param('id') id: string,
    @Body() dto: SubmitCatalogRequestDto,
  ) {
    return this.svc.submitRequest(id, dto.formData);
  }

  // Admin manage
  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create service',
    description: 'Admin: create a service.',
  })
  @Post('services')
  createService(@Body() dto: CreateServiceDto) {
    return this.svc.createService(dto);
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create template',
    description: 'Admin: create a request template.',
  })
  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.svc.createTemplate(dto);
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Update template',
    description: 'Admin: update a request template.',
  })
  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.svc.updateTemplate(id, dto);
  }
}
