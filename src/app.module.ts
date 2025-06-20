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

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRoot(dbDataSource.options),
    CaslModule,
    IncidentsModule,
    SlaModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
