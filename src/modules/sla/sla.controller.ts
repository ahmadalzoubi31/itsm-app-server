import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CreateSlaTargetDto } from './dto/create-target.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { CurrentUser } from '@modules/iam/decorators/current-user.decorator';
import { SlaService } from './services/sla.service';
import {
  CaseCreatedEvent,
  CaseStatusChangedEvent,
  CaseAssignedEvent,
  CaseGroupAssignedEvent,
} from '@shared/contracts/events';
import { OnEvent } from '@nestjs/event-emitter';

@ApiTags('SLA')
@ApiBearerAuth('access-token')
@Controller('sla')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
export class SlaController {
  private readonly logger = new Logger(SlaController.name);

  constructor(private readonly slaSvc: SlaService) {
    this.logger.log('SlaController initialized');
  }
  // Minimal Admin endpoints (add under AdminController)
  @Post('targets') createTarget(
    @CurrentUser() user,
    @Body() dto: CreateSlaTargetDto,
  ) {
    this.logger.log(`Creating SLA target by ${user.username} (${user.userId})`);
    return this.slaSvc.createTarget({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @Get('targets') listTargets() {
    this.logger.debug('Listing SLA targets');
    return this.slaSvc.listTargets();
  }

  @Delete('targets/:id') removeTarget(@Param('id') id: string) {
    this.logger.log(`Removing SLA target ${id}`);
    return this.slaSvc.removeTarget(id);
  }

  @OnEvent('case.created')
  handleCaseCreatedEvent(payload: CaseCreatedEvent) {
    return this.slaSvc.initForCase({
      id: payload.caseId,
      businessLineId: payload.payload.businessLineId,
      priority: payload.payload.priority,
    });
  }

  @OnEvent('case.status.changed')
  handleCaseStatusChangedEvent(payload: CaseStatusChangedEvent) {
    return this.slaSvc.processSlaEvent(
      'case.status.changed',
      payload.payload,
      payload.caseId,
    );
  }

  @OnEvent('case.assigned')
  handleCaseAssignedEvent(payload: CaseAssignedEvent) {
    return this.slaSvc.processSlaEvent(
      'case.assigned',
      payload.payload,
      payload.caseId,
    );
  }

  @OnEvent('case.group.assigned')
  handleCaseGroupAssignedEvent(payload: CaseGroupAssignedEvent) {
    return this.slaSvc.processSlaEvent(
      'case.group.assigned',
      payload.payload,
      payload.caseId,
    );
  }
}
