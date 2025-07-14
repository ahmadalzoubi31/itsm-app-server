import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { CaslModule } from './casl/casl.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SlaModule } from './sla/sla.module';
import { PermissionsModule } from './permissions/permissions.module';
import dbDataSource from './db/data-source';
import { LdapModule } from './ldap/ldap.module';
import { SerivceCardsModule } from './serivce-cards/serivce-cards.module';
import { SerivceRequestsModule } from './serivce-requests/serivce-requests.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { SettingsModule } from './settings/settings.module';
import { EmailModule } from './email/email.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(), 
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          ...dbDataSource.options,
        };
      },
    }),
    AuthModule,
    SharedModule,
    CaslModule,
    UsersModule,
    PermissionsModule,
    IncidentsModule,
    SlaModule,
    LdapModule,
    SerivceCardsModule,
    SerivceRequestsModule,
    WorkflowsModule,
    SettingsModule,
    EmailModule,
    GroupsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
