import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/databaseConfig';
import jwtConfig from './config/jwtConfig';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [jwtConfig] }),
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
