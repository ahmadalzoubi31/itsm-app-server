import { Module } from '@nestjs/common';
import { IamCacheInvalidationHandler } from './iam-cache-invalidation.handler';
import { IamCoreModule } from './core/iam-core.module';
import { IamService } from './iam.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    IamCoreModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    GroupsModule,
    RolesModule,
  ],
  controllers: [],
  providers: [IamCacheInvalidationHandler, IamService],
  exports: [IamCoreModule, IamService],
})
export class IamModule {}
