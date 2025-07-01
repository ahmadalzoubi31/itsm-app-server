import { Controller, Get, Post } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { LdapSettingDto } from './dto/ldap-settings.dto';
import { Body } from '@nestjs/common';

@Controller('ldap')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

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
}
