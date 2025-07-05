import { Module } from '@nestjs/common';
import { LdapController } from './ldap.controller';
import { LdapService } from './ldap.service';
import { SettingsService } from '../settings/settings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../settings/entities/settings.entity';
import { SyncHistory } from './entities/sync-history.entity';
import { StagedUser } from './entities/staged-user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Settings, SyncHistory, StagedUser]),
  ],
  controllers: [LdapController],
  providers: [LdapService, SettingsService],
})
export class LdapModule {}
