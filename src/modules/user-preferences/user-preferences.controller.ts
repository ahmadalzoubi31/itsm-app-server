// src/modules/user-preferences/user-preferences.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';
import { UserPreferencesService } from './user-preferences.service';
import { UpsertTablePreferenceDto } from './dto/upsert-table-preference.dto';
import { UpsertFilterPreferenceDto } from './dto/upsert-filter-preference.dto';

@ApiTags('User Preferences')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @ApiOperation({ summary: 'Get table preference for current user' })
  @Get('table/:preferenceKey')
  async getTablePreference(
    @CurrentUser() user: { userId: string },
    @Param('preferenceKey') preferenceKey: string,
  ) {
    const pref = await this.preferencesService.getTablePreference(
      user.userId,
      preferenceKey,
    );

    // if null then post new default preference
    if (!pref) {
      return { preferences: null };
    }
    return { preferences: pref.preferences };
  }

  @ApiOperation({ summary: 'Save or update table preference for current user' })
  @Post('table')
  async upsertTablePreference(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpsertTablePreferenceDto,
  ) {
    const pref = await this.preferencesService.upsertTablePreference(
      user.userId,
      dto,
    );
    return { preferences: pref.preferences };
  }

  @ApiOperation({ summary: 'Delete table preference for current user' })
  @Delete('table/:preferenceKey')
  async deleteTablePreference(
    @CurrentUser() user: { userId: string },
    @Param('preferenceKey') preferenceKey: string,
  ) {
    await this.preferencesService.deleteTablePreference(
      user.userId,
      preferenceKey,
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Get filter preferences for current user' })
  @Get('filters/:preferenceKey')
  async getFilterPreferences(
    @CurrentUser() user: { userId: string },
    @Param('preferenceKey') preferenceKey: string,
  ) {
    const pref = await this.preferencesService.getFilterPreferences(
      user.userId,
      preferenceKey,
    );

    // if null then return null
    if (!pref) {
      return { filters: null };
    }
    return { filters: pref.preferences };
  }

  @ApiOperation({ summary: 'Save or update filter preferences for current user' })
  @Post('filters')
  async upsertFilterPreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpsertFilterPreferenceDto,
  ) {
    const pref = await this.preferencesService.upsertFilterPreferences(
      user.userId,
      dto,
    );
    return { filters: pref.preferences };
  }

  @ApiOperation({ summary: 'Delete filter preferences for current user' })
  @Delete('filters/:preferenceKey')
  async deleteFilterPreferences(
    @CurrentUser() user: { userId: string },
    @Param('preferenceKey') preferenceKey: string,
  ) {
    await this.preferencesService.deleteFilterPreferences(
      user.userId,
      preferenceKey,
    );
    return { success: true };
  }
}
