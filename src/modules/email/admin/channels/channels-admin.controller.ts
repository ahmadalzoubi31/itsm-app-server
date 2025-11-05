// src/modules/email/admin/channels/channels-admin.controller.ts
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
import { ChannelsAdminService } from './channels-admin.service';
import { CreateEmailChannelDto } from '../../dto/create-email-channel.dto';
import { UpdateEmailChannelDto } from '../../dto/update-email-channel.dto';

@ApiTags('Admin / Email Channels')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
@Controller('admin/email/channels')
export class ChannelsAdminController {
  private readonly logger = new Logger(ChannelsAdminController.name);

  constructor(private readonly svc: ChannelsAdminService) {}

  @ApiOperation({ summary: 'List email channels' })
  @Get()
  list() {
    return this.svc.list();
  }

  @ApiOperation({ summary: 'Create email channel' })
  @Post()
  create(@Body() dto: CreateEmailChannelDto) {
    return this.svc.create(dto);
  }

  @ApiOperation({ summary: 'Update email channel' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmailChannelDto) {
    return this.svc.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete email channel' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @ApiOperation({ summary: 'Test SMTP channel Connection' })
  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.svc.testConnection(id);
  }

  @ApiOperation({ summary: 'Simulate incoming email processing' })
  @Post(':id/simulate-incoming')
  simulateIncoming(
    @Param('id') id: string,
    @Body()
    dto: {
      messageId: string;
      from: string;
      to: string[];
      subject: string;
      text?: string;
      html?: string;
      inReplyTo?: string;
      references?: string[];
    },
  ) {
    return this.svc.simulateIncomingEmail(id, dto);
  }
}
