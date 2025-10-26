// src/modules/business-line/business-line.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CurrentUser } from '@modules/iam/decorators/current-user.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { BusinessLineService } from './business-line.service';
import { CreateBusinessLineDto } from './dto/create-business-line.dto';
import { UpdateBusinessLineDto } from './dto/update-business-line.dto';

@ApiTags('Business Line')
@ApiBearerAuth('access-token')
@Controller('business-lines')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class BusinessLineController {
  constructor(private readonly businessLineService: BusinessLineService) {}

  @ApiOperation({
    summary: 'List all business lines',
    description: 'Get all active business lines (HR, IT, Finance, etc.)',
  })
  @Get()
  findAll() {
    return this.businessLineService.findAll();
  }

  @ApiOperation({
    summary: 'Get business line by ID',
    description: 'Retrieve a specific business line',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessLineService.findOne(id);
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create business line',
    description: 'Admin: Create a new business line',
  })
  @Post()
  create(@CurrentUser() user, @Body() dto: CreateBusinessLineDto) {
    return this.businessLineService.create(dto, user.userId, user.username);
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Update business line',
    description: 'Admin: Update an existing business line',
  })
  @Patch(':id')
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessLineDto,
  ) {
    return this.businessLineService.update(id, dto, user.userId, user.username);
  }

  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Deactivate business line',
    description: 'Admin: Soft delete a business line',
  })
  @Delete(':id')
  deactivate(@CurrentUser() user, @Param('id') id: string) {
    return this.businessLineService.deactivate(id, user.userId, user.username);
  }
}
