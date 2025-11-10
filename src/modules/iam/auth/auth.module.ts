// src/modules/iam/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    CaslModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Role,
      RefreshToken,
      TokenBlacklist,
      Permission,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.get('jwt');
        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
