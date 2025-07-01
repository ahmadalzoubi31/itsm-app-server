import { Module } from '@nestjs/common';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { SettingsModule } from '../settings/settings.module';
import { SettingsService } from '../settings/settings.service';

@Module({
  imports: [SettingsModule],
  controllers: [LdapController],
  providers: [LdapService, SettingsService],
})
export class LdapModule {}
