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
import { Membership } from '../users/entities/membership.entity';
import { Group } from '../groups/entities/group.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../permissions/entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../permissions/entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    CaslModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Membership,
      Group,
      UserRole,
      Role,
      RefreshToken,
      TokenBlacklist,
      Permission,
      RolePermission,
      GroupRole,
      UserPermission,
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
