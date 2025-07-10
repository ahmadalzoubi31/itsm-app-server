import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { LdapSchedulerService } from './ldap-scheduler.service';
import { SettingsService } from '../settings/settings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../settings/entities/settings.entity';
import { SyncHistory } from './entities/sync-history.entity';
import { StagedUser } from './entities/staged-user.entity';
import { UsersModule } from '../users/users.module';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    TypeOrmModule.forFeature([Settings, SyncHistory, StagedUser]),
  ],
  controllers: [LdapController],
  providers: [
    LdapService,
    LdapSchedulerService,
    SettingsService,
    CaslAbilityFactory,
  ],
  exports: [LdapSchedulerService],
})
export class LdapModule {}
