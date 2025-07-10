import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { LdapService } from './ldap.service';
import { LdapSchedulerService } from './ldap-scheduler.service';
import { LdapSettingDto } from './dto/ldap-settings.dto';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditFieldsInterceptor } from '../shared/interceptors/audit-fields.interceptor';
import { Action } from 'src/casl/enums/action.enum';
import { Settings } from 'src/settings/entities/settings.entity';
import { AppAbility } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('ldap')
export class LdapController {
  constructor(
    private readonly ldapService: LdapService,
    private readonly ldapSchedulerService: LdapSchedulerService,
  ) {}

  @Get('preview')
  async previewUsers() {
    return this.ldapService.previewUsers();
  }

  @Get('users')
  async getAdUsers() {
    return this.ldapService.searchUsers();
  }

  @Post('test')
  async testConnection(@Body() body: LdapSettingDto) {
    return this.ldapService.testConnection(body);
  }

  @Post('sync')
  @UseInterceptors(AuditFieldsInterceptor)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async sync(@Body() body: { isManualSync: boolean }) {
    return this.ldapService.syncUsers(body.isManualSync);
  }

  @Post('sync/cancel')
  @UseInterceptors(AuditFieldsInterceptor)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async cancelSync() {
    return this.ldapService.cancelSync();
  }

  @Get('sync-history')
  async getSyncHistory() {
    return this.ldapService.getSyncHistory();
  }

  @Get('sync-status')
  async getSyncStatus() {
    return this.ldapService.getSyncStatus();
  }

  @Get('staged-users')
  @UseInterceptors(AuditFieldsInterceptor)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getStagedUsers() {
    return this.ldapService.getStagedUsers();
  }

  @Post('import-users')
  // @UseInterceptors(AuditFieldsInterceptor)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async importStagedUsers(@Body() body: string[]) {
    return this.ldapService.importStagedUsersIntoActualUsers(body);
  }

  @Post('reject-users')
  @UseInterceptors(AuditFieldsInterceptor)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async rejectStagedUsers(@Body() body: string[]) {
    return this.ldapService.rejectStagedUsers(body);
  }

  @Get('scheduler-status')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getSchedulerStatus() {
    return this.ldapSchedulerService.handleCron();
  }
}
