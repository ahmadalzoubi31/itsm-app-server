// src/modules/email/admin/rules/rules-admin.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { RulesAdminService } from './rules-admin.service';
import { CreateEmailRoutingRuleDto } from '../../dto/create-email-routing-rule.dto';
import { UpdateEmailRoutingRuleDto } from '../../dto/update-email-routing-rule.dto';

@ApiTags('Admin / Email Rules')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
@Controller('admin/email/rules')
export class RulesAdminController {
  private readonly logger = new Logger(RulesAdminController.name);

  constructor(private readonly svc: RulesAdminService) {}

  @ApiOperation({ summary: 'List rules' })
  @Get()
  list() {
    return this.svc.list();
  }

  @ApiOperation({ summary: 'Create rule' })
  @Post()
  create(@Body() dto: CreateEmailRoutingRuleDto) {
    return this.svc.create(dto);
  }

  @ApiOperation({ summary: 'Update rule' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmailRoutingRuleDto) {
    return this.svc.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete rule' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
