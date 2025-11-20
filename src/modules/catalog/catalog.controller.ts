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
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateRequestCardDto } from './dto/create-requests-card.dto';
import { UpdateRequestCardDto } from './dto/update-requests-card.dto';
import { SubmitCatalogRequestDto } from './dto/submit-catalog-request.dto';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { Logger } from '@nestjs/common';
import { JwtUser } from '@shared/types/jwt-user.type';
import { Service } from './entities/service.entity';
import { RequestCard } from './entities/request-card.entity';
import { Request } from '@modules/request/entities/request.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';

@ApiTags('Catalog')
@ApiBearerAuth('access-token')
@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);

  constructor(private readonly svc: CatalogService) {
    this.logger.log('CatalogController initialized');
  }

  // Public browse (authenticated)
  @ApiOperation({
    summary: 'List services',
    description: 'List available services.',
  })
  @Get('services')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Service)
  listServices() {
    return this.svc.listServices();
  }

  @ApiOperation({
    summary: 'List service cards',
    description: 'List available service cards.',
  })
  @Get('request-cards')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, RequestCard)
  listRequestCards() {
    return this.svc.listRequestCards();
  }

  @ApiOperation({
    summary: 'List request cards by service',
    description: 'Request cards for a service.',
  })
  @Get('services/:id/request-cards')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Service)
  listRequestCardsByService(@Param('id') id: string) {
    return this.svc.listRequestCardsByService(id);
  }

  @ApiOperation({
    summary: 'Get service card',
    description: 'Get a single service card.',
  })
  @Get('request-cards/:id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CatalogService, 'getRequestCard')
  getRequestCard(@Param('id') id: string) {
    return this.svc.getRequestCard(id);
  }

  @ApiOperation({
    summary: 'Submit request from service card',
    description: 'Submit a service request from a catalog service card.',
  })
  @Post('request-cards/:id/submit')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Request)
  submitFromRequestCard(
    @Param('id') id: string,
    @Body() dto: SubmitCatalogRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.submitRequest(id, dto.formData, user);
  }

  @ApiOperation({
    summary: 'Get dynamic dropdown options',
    description: 'Get options for database-connected dropdown fields.',
  })
  @Get('dropdown-options')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  getDropdownOptions(
    @Query('entity') entity: string,
    @Query('displayField') displayField: string,
    @Query('valueField') valueField: string,
    @Query('filters') filters?: string,
  ) {
    return this.svc.getDropdownOptions(
      entity,
      displayField,
      valueField,
      filters,
    );
  }

  // Admin manage
  @ApiOperation({
    summary: 'Create service',
    description: 'Admin: create a service.',
  })
  @Post('services')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Service)
  createService(@Body() dto: CreateServiceDto) {
    return this.svc.createService(dto);
  }

  @ApiOperation({
    summary: 'Create request card',
    description: 'Admin: create a request card.',
  })
  @Post('request-cards')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, RequestCard)
  createRequestCard(@Body() dto: CreateRequestCardDto) {
    this.logger.debug('Received DTO:', JSON.stringify(dto, null, 2));
    return this.svc.createRequestCard(dto);
  }

  @ApiOperation({
    summary: 'Update request card',
    description: 'Admin: update a request card.',
  })
  @Put('request-cards/:id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CatalogService, 'getRequestCard')
  updateRequestCard(
    @Param('id') id: string,
    @Body() dto: UpdateRequestCardDto,
  ) {
    return this.svc.updateRequestCard(id, dto);
  }
}
