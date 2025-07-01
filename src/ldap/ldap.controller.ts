import { Controller, Get, Post } from '@nestjs/common';
import { LdapService } from './ldap.service';

@Controller('ldap')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

  @Get('users')
  async getAdUsers() {
    return this.ldapService.searchUsers();
  }

  @Post('test')
  async testConnection() {
    return this.ldapService.testConnection();
  }

  @Post('sync')
  async sync() {
    return this.ldapService.syncUsers();
  }
}
