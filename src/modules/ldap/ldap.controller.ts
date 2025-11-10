import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LdapService } from './ldap.service';
import {
  CreateLdapConfigDto,
  UpdateLdapConfigDto,
  TestLdapConnectionDto,
} from './dto/ldap.dto';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog } from './entities/ldap-sync-log.entity';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';

@ApiTags('Settings / LDAP')
@Controller('settings/ldap')
@UseGuards(JwtAuthGuard)
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

  @Post('config')
  @ApiOperation({ summary: 'Create LDAP configuration' })
  @ApiResponse({ status: 201, type: LdapConfig })
  async createConfig(
    @Body() createLdapConfigDto: CreateLdapConfigDto,
  ): Promise<LdapConfig> {
    return this.ldapService.createConfig(createLdapConfigDto);
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update LDAP configuration' })
  @ApiResponse({ status: 200, type: LdapConfig })
  async updateConfig(
    @Param('id') id: string,
    @Body() updateLdapConfigDto: UpdateLdapConfigDto,
  ): Promise<LdapConfig> {
    return this.ldapService.updateConfig(id, updateLdapConfigDto);
  }

  @Get('config/:id')
  @ApiOperation({ summary: 'Get LDAP configuration by ID' })
  @ApiResponse({ status: 200, type: LdapConfig })
  async getConfig(@Param('id') id: string): Promise<LdapConfig> {
    return this.ldapService.getConfig(id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get all LDAP configurations' })
  @ApiResponse({ status: 200, type: [LdapConfig] })
  async getAllConfigs(): Promise<LdapConfig[]> {
    return this.ldapService.getAllConfigs();
  }

  @Delete('config/:id')
  @ApiOperation({ summary: 'Delete LDAP configuration' })
  @ApiResponse({ status: 204 })
  async deleteConfig(@Param('id') id: string): Promise<void> {
    return this.ldapService.deleteConfig(id);
  }

  @Post('config/:id/test')
  @ApiOperation({ summary: 'Test LDAP connection' })
  @ApiResponse({ status: 200, type: Boolean })
  async testConnection(
    @Param('id') id: string,
    @Body() testDto: TestLdapConnectionDto,
  ): Promise<boolean> {
    return this.ldapService.testConnection(id, testDto);
  }

  @Post('config/:id/sync')
  @ApiOperation({ summary: 'Start LDAP synchronization' })
  @ApiResponse({ status: 201, type: LdapSyncLog })
  async startSync(@Param('id') id: string): Promise<LdapSyncLog> {
    return this.ldapService.startSync(id);
  }

  @Get('sync/:id')
  @ApiOperation({ summary: 'Get sync status' })
  @ApiResponse({ status: 200, type: LdapSyncLog })
  async getSyncStatus(@Param('id') id: string): Promise<LdapSyncLog> {
    return this.ldapService.getSyncStatus(id);
  }
}
