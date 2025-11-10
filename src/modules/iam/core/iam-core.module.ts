import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamPermissionService } from './iam-permission.service';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role])],
  providers: [IamPermissionService],
  exports: [IamPermissionService],
})
export class IamCoreModule {}
