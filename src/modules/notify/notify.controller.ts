// src/modules/notify/notify.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotifyPref } from './entities/user-notify-pref.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { CreateUserNotifyPrefDto } from './dto/create-user-notify-pref.dto';
import { UpdateUserNotifyPrefDto } from './dto/update-user-notify-pref.dto';
import {
  CaseAssignedEvent,
  CaseCreatedEvent,
  CaseGroupAssignedEvent,
  CaseStatusChangedEvent,
  SlaBreachedEvent,
} from '@shared/contracts/events';
import { OnEvent } from '@nestjs/event-emitter';
import { NotifyWorker } from './notify.worker';

@ApiTags('Admin / Notify')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
@Controller('admin/notify')
export class NotifyController {
  constructor(
    @InjectRepository(UserNotifyPref)
    private readonly prefs: Repository<UserNotifyPref>,
    private readonly notifyWorker: NotifyWorker,
  ) {}

  @ApiOperation({ summary: 'List user notification preferences' })
  @Get('prefs/:userId')
  listPrefs(@Param('userId') uid: string) {
    return this.prefs.find({ where: { userId: uid } });
  }

  @ApiOperation({ summary: 'Upsert user notification preference' })
  @Post('prefs')
  upsertPref(@Body() dto: CreateUserNotifyPrefDto) {
    return this.prefs.save(dto);
  }

  @ApiOperation({ summary: 'Update user notification preference' })
  @Put('prefs/:id')
  updatePref(@Param('id') id: string, @Body() dto: UpdateUserNotifyPrefDto) {
    return this.prefs.update(id, dto);
  }

  @OnEvent('case.created')
  handleCaseCreatedEvent(payload: CaseCreatedEvent) {
    return this.notifyWorker.handleCaseCreated(payload);
  }

  @OnEvent('case.status.changed')
  handleCaseStatusChangedEvent(payload: CaseStatusChangedEvent) {
    return this.notifyWorker.handleCaseStatusChanged(payload);
  }

  @OnEvent('case.assigned')
  handleCaseAssignedEvent(payload: CaseAssignedEvent) {
    return this.notifyWorker.handleCaseAssigned(payload);
  }

  @OnEvent('case.group.assigned')
  handleCaseGroupAssignedEvent(payload: CaseGroupAssignedEvent) {
    return this.notifyWorker.handleCaseGroupAssigned(payload);
  }

  @OnEvent('sla.breached')
  handleSlaBreachedEvent(payload: SlaBreachedEvent) {
    return this.notifyWorker.handleSlaBreached(payload);
  }
}
