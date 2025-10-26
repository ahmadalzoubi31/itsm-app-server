/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupRole } from './entities/group-role.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [CaslModule, TypeOrmModule.forFeature([Group, GroupRole])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
