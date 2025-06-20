import { Controller, Get } from '@nestjs/common';
import { LdapService } from './ldap.service';

@Controller('ldap')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

  @Get('users')
  async getAdUsers() {
    return this.ldapService.searchUsers();
  }
}
