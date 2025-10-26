import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    MembershipModule,
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
      GroupRole,
      UserRole,
      UserPermission,
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
