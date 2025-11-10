/*
https://docs.nestjs.com/modules
*/

import { Module, forwardRef } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Membership } from './entities/membership.entity';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    CaslModule,
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([Group, Membership]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
