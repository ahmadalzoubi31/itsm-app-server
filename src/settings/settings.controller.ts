import {
  UseInterceptors,
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingTypeEnum } from './constants/type.constant';
import { AuditFieldsInterceptor } from '../shared/interceptors/audit-fields.interceptor';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { AppAbility } from '../casl/casl-ability.factory';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/enums/action.enum';
import { Settings } from './entities/settings.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditFieldsInterceptor)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Get settings by type, e.g., /settings/ldap or /settings/sync
  @Get(':type')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getSettingsByType(@Param('type') type: SettingTypeEnum) {
    return this.settingsService.getByType(type);
  }

  // Upsert (create/update) settings by type (body: {type, jsonValue})
  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async upsertSettings(@Body() dto: CreateSettingDto) {
    return this.settingsService.upsertByType(dto);
  }
}
