import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { Membership } from '../users/entities/membership.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    UsersModule,
    GroupsModule,
    CaslModule,
    TypeOrmModule.forFeature([User, Group, Membership]),
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
