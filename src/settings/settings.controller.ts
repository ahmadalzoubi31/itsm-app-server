import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingTypeEnum } from './constants/type.constant';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Get settings by type, e.g., /settings/ldap or /settings/sync
  @Get(':type')
  async getSettingsByType(@Param('type') type: SettingTypeEnum) {
    return this.settingsService.getByType(type);
  }

  // Upsert (create/update) settings by type (body: {type, jsonValue})
  @Post()
  async upsertSettings(@Body() dto: CreateSettingDto) {
    return this.settingsService.upsertByType(dto);
  }
}
