import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncHistory } from './entities/sync-history.entity';
import { StagedUser } from './entities/staged-user.entity';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';
import { SettingsModule } from '../settings/settings.module';
import { LdapSchedulerService } from './ldap-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncHistory, StagedUser]),
    CaslModule,
    SettingsModule,
    UsersModule,
  ],
  controllers: [LdapController],
  providers: [LdapService, LdapSchedulerService],
  exports: [],
})
export class LdapModule {}
