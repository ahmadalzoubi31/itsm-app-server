// src/modules/email/admin/templates/templates-admin.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { TemplatesAdminService } from './templates-admin.service';
import { CurrentUser } from '@modules/iam/decorators/current-user.decorator';
import { JwtUser } from '@shared/types/jwt-user.type';
import { CreateNotificationTemplateDto } from '../../dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../../dto/update-notification-template.dto';

@ApiTags('Admin / Email Templates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility(IAM_ACTIONS.Manage, 'all')
@Controller('admin/email/templates')
export class TemplatesAdminController {
  private readonly logger = new Logger(TemplatesAdminController.name);

  constructor(private readonly svc: TemplatesAdminService) {}

  @ApiOperation({ summary: 'List notification templates' })
  @Get()
  listTemplates() {
    return this.svc.list();
  }

  @ApiOperation({ summary: 'Create notification template' })
  @Post()
  createTemplate(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateNotificationTemplateDto,
  ) {
    return this.svc.create({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @ApiOperation({ summary: 'Update notification template' })
  @Patch(':id')
  updateTemplate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.svc.update(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }

  @ApiOperation({ summary: 'Delete notification template' })
  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
