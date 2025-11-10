import { Module } from '@nestjs/common';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog } from './entities/ldap-sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LdapConfig, LdapSyncLog])],
  controllers: [LdapController],
  providers: [LdapService],
  exports: [LdapService],
})
export class LdapModule {}
