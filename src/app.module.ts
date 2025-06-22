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
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refreshToken.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Incident } from './incidents/entities/incident.entity';
import { IncidentComment } from './incidents/entities/incident-comment.entity';
import { IncidentHistory } from './incidents/entities/incident-history.entity';
import { LdapModule } from './ldap/ldap.module';

@Module({
  imports: [
    AuthModule,
    SharedModule,
    CaslModule,
    UsersModule,
    PermissionsModule,
    IncidentsModule,
    SlaModule,
    LdapModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          ...dbDataSource.options,
          entities: [
            User,
            RefreshToken,
            Permission,
            Incident,
            IncidentComment,
            IncidentHistory,
          ],
          migrations: ['./db/migrations/*.ts'],
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
