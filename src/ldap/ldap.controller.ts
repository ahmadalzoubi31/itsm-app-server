import { Controller, Get, Post } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { LdapSettingDto } from './dto/ldap-settings.dto';
import { Body } from '@nestjs/common';

@Controller('ldap')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

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
  async sync() {
    return this.ldapService.syncUsers();
  }

  @Get('sync-history')
  async getSyncHistory() {
    return this.ldapService.getSyncHistory();
  }

  @Get('staged-users')
  async getStagedUsers() {
    return this.ldapService.getStagedUsers();
  }
}
