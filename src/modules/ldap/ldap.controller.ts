import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LdapService } from './ldap.service';
import {
  CreateLdapConfigDto,
  UpdateLdapConfigDto,
  LdapSyncOptionsDto,
  LdapAuthenticateDto,
} from './dto/ldap.dto';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog } from './entities/ldap-sync-log.entity';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';
import { StagedUserService } from './services/staged-user.service';
import { StagedUser, StagedUserStatus } from './entities/staged-user.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('Settings / LDAP')
@Controller('settings/ldap')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LdapController {
  constructor(
    private readonly ldapService: LdapService,
    private readonly stagedUserService: StagedUserService,
  ) {}

  // ==================== Configuration Management ====================

  @Post('config')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, LdapConfig)
  @ApiOperation({
    summary: 'Create LDAP configuration',
    description: 'Create a new LDAP/AD configuration for user synchronization',
  })
  @ApiResponse({
    status: 201,
    description: 'LDAP configuration created successfully',
    type: LdapConfig,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration data',
  })
  async createConfig(
    @Body() createLdapConfigDto: CreateLdapConfigDto,
  ): Promise<LdapConfig> {
    return this.ldapService.createConfig(createLdapConfigDto);
  }

  @Get('config')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, LdapConfig)
  @ApiOperation({
    summary: 'Get all LDAP configurations',
    description: 'Retrieve all LDAP configurations (passwords excluded)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of LDAP configurations',
    type: [LdapConfig],
  })
  async getAllConfigs(): Promise<LdapConfig[]> {
    return this.ldapService.getAllConfigs();
  }

  @Get('config/:id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Get LDAP configuration by ID',
    description: 'Retrieve a specific LDAP configuration (password excluded)',
  })
  @ApiResponse({
    status: 200,
    description: 'LDAP configuration details',
    type: LdapConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async getConfig(@Param('id') id: string): Promise<LdapConfig> {
    return this.ldapService.getConfig(id, false);
  }

  @Put('config/:id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Update LDAP configuration',
    description: 'Update an existing LDAP configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'LDAP configuration updated successfully',
    type: LdapConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async updateConfig(
    @Param('id') id: string,
    @Body() updateLdapConfigDto: UpdateLdapConfigDto,
  ): Promise<LdapConfig> {
    return this.ldapService.updateConfig(id, updateLdapConfigDto);
  }

  @Delete('config/:id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Delete, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Delete LDAP configuration',
    description: 'Delete an LDAP configuration and all associated sync logs',
  })
  @ApiResponse({
    status: 204,
    description: 'LDAP configuration deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async deleteConfig(@Param('id') id: string): Promise<void> {
    return this.ldapService.deleteConfig(id);
  }

  // ==================== Connection Testing ====================

  @Post('config/:id/test')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Test LDAP connection and authentication',
    description:
      'Test LDAP server connection and authenticate a user to verify configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userInfo: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async testConnection(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; userInfo?: any }> {
    return this.ldapService.testConnection(id);
  }

  // ==================== User Synchronization ====================

  @Post('config/:id/sync')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Start LDAP user synchronization',
    description:
      'Trigger a manual synchronization of users from LDAP/AD to the application',
  })
  @ApiResponse({
    status: 201,
    description: 'Sync started successfully',
    type: LdapSyncLog,
  })
  @ApiResponse({
    status: 400,
    description: 'Sync already in progress or configuration disabled',
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async startSync(
    @Param('id') id: string,
    @Body() options?: LdapSyncOptionsDto,
  ): Promise<LdapSyncLog> {
    return this.ldapService.startSync(id, 'manual', options);
  }

  @Get('sync/:id')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  @ApiOperation({
    summary: 'Get sync status',
    description: 'Get the status and details of a specific sync operation',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync status details',
    type: LdapSyncLog,
  })
  @ApiResponse({
    status: 404,
    description: 'Sync log not found',
  })
  async getSyncStatus(@Param('id') id: string): Promise<LdapSyncLog> {
    return this.ldapService.getSyncStatus(id);
  }

  @Get('config/:id/sync-history')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, LdapService, 'getConfig')
  @ApiOperation({
    summary: 'Get sync history',
    description: 'Get the synchronization history for a specific configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync history',
    type: [LdapSyncLog],
  })
  @ApiResponse({
    status: 404,
    description: 'LDAP configuration not found',
  })
  async getSyncHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<LdapSyncLog[]> {
    return this.ldapService.getSyncHistory(id, limit || 50);
  }

  @Post('sync/cancel')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Update, LdapConfig)
  @ApiOperation({
    summary: 'Cancel ongoing synchronization',
    description: 'Cancel the currently running LDAP synchronization',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync cancelled successfully',
    type: LdapSyncLog,
  })
  @ApiResponse({
    status: 404,
    description: 'No running sync found',
  })
  async cancelSync(@Query('configId') configId?: string): Promise<LdapSyncLog> {
    return this.ldapService.cancelSync(configId);
  }

  // ==================== User Preview ====================

  @Get('sample')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, LdapConfig)
  @ApiOperation({
    summary: 'Get sample LDAP users',
    description:
      'Preview a sample of users from LDAP/AD (maximum 10 users) to verify configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Sample LDAP users',
  })
  @ApiResponse({
    status: 404,
    description: 'No LDAP configuration found',
  })
  async showSample(@Query('configId') configId?: string): Promise<any[]> {
    return this.ldapService.showSample(configId);
  }

  // ==================== Authentication ====================

  @Post('authenticate')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  @ApiOperation({
    summary: 'Authenticate user via LDAP',
    description:
      'Authenticate a user against LDAP/AD and create or update their account',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async authenticate(@Body() dto: LdapAuthenticateDto): Promise<any> {
    const user = await this.ldapService.authenticateUser(dto);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: 'Authentication failed' };
  }

  // ==================== Staged Users ====================

  @Get('staged-users')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  @ApiOperation({
    summary: 'Get staged users',
    description:
      'Retrieve all staged users from LDAP sync, optionally filtered by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of staged users',
    type: [StagedUser],
  })
  async getStagedUsers(
    @Query('status') status?: StagedUserStatus,
  ): Promise<StagedUser[]> {
    return this.stagedUserService.findAll(status);
  }

  @Post('import-users')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, 'all')
  @ApiOperation({
    summary: 'Import staged users',
    description:
      'Import selected staged users to the main user table. Users will be created or updated based on their status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Import result',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No valid staged users found to import',
  })
  async importUsers(
    @CurrentUser() user: { userId: string; username: string },
    @Body() ids: string[],
    @Query('configId') configId?: string,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    let config: LdapConfig | undefined;
    if (configId) {
      config = await this.ldapService.getConfig(configId, false);
    }
    return this.stagedUserService.importUsers(
      ids,
      user.userId,
      user.username,
      config,
    );
  }

  @Post('reject-users')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Update, 'all')
  @ApiOperation({
    summary: 'Reject staged users',
    description:
      'Reject selected staged users. They will be marked as rejected and will not be imported.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rejection result',
    schema: {
      type: 'object',
      properties: {
        rejected: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No valid staged users found to reject',
  })
  async rejectUsers(
    @CurrentUser() user: { userId: string; username: string },
    @Body() body: { ids: string[]; reason?: string },
  ): Promise<{ rejected: number; failed: number; errors: string[] }> {
    return this.stagedUserService.rejectUsers(
      body.ids,
      user.userId,
      user.username,
      body.reason,
    );
  }
}
