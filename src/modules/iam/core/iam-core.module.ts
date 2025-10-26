import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamPermissionService } from './iam-permission.service';
import { Permission } from '../permissions/entities/permission.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { RolePermission } from '../permissions/entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      UserRole,
      RolePermission,
      GroupRole,
      UserPermission,
    ]),
  ],
  providers: [IamPermissionService],
  exports: [IamPermissionService],
})
export class IamCoreModule {}
