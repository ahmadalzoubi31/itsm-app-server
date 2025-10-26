// src/modules/email/admin/messages/messages-admin.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { MessagesAdminService } from './messages-admin.service';

@ApiTags('Admin / Email Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
@Controller('admin/email/messages')
export class MessagesAdminController {
  private readonly logger = new Logger(MessagesAdminController.name);

  constructor(private readonly svc: MessagesAdminService) {}

  @ApiOperation({ summary: 'List all email messages' })
  @Get()
  listMessages(
    @Query('direction') direction?: 'inbound' | 'outbound',
    @Query('limit') limit?: number,
  ) {
    this.logger.debug('Listing email messages');
    return this.svc.list({ direction, limit });
  }

  @ApiOperation({ summary: 'Get email message by ID' })
  @Get(':id')
  getMessage(@Param('id') id: string) {
    this.logger.debug(`Getting email message ${id}`);
    return this.svc.findOne(id);
  }

  @ApiOperation({ summary: 'List messages for a specific case' })
  @Get('case/:caseId')
  getMessagesForCase(@Param('caseId') caseId: string) {
    this.logger.debug(`Getting email messages for case ${caseId}`);
    return this.svc.findByCaseId(caseId);
  }
}
