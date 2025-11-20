import { Module } from '@nestjs/common';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog } from './entities/ldap-sync-log.entity';
import { StagedUser } from './entities/staged-user.entity';
import { UsersModule } from '@modules/iam/users/users.module';
import { RolesModule } from '@modules/iam/roles/roles.module';
import { LdapClientService } from './helpers/ldap-client.service';
import { LdapUserMapperService } from './helpers/ldap-user-mapper.service';
import { LdapSyncService } from './helpers/ldap-sync.service';
import { LdapEncryptionService } from './helpers/ldap-encryption.service';
import { StagedUserService } from './services/staged-user.service';
import { CaslModule } from '@modules/iam/casl/casl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LdapConfig, LdapSyncLog, StagedUser]),
    UsersModule,
    RolesModule,
    CaslModule,
  ],
  controllers: [LdapController],
  providers: [
    LdapService,
    LdapClientService,
    LdapUserMapperService,
    LdapSyncService,
    LdapEncryptionService,
    StagedUserService,
  ],
  exports: [LdapService, StagedUserService],
})
export class LdapModule {}
