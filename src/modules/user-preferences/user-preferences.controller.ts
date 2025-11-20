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
    return pref ? { preferences: pref.preferences } : null;
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
}
