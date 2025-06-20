import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Permission, User])],
  controllers: [PermissionsController],
  providers: [PermissionsService, CaslAbilityFactory],
})
export class PermissionsModule {}
