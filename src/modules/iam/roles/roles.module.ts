import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    MembershipModule,
    TypeOrmModule.forFeature([
      Role,
      RolePermission,
      GroupRole,
      UserRole,
      UserPermission,
      Permission,
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
