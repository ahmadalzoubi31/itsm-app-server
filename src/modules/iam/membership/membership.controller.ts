import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembershipService, MembershipResponse } from './membership.service';
import { AddMemberDto } from '../groups/dto/add-member.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { ResourcePoliciesGuard } from '../casl/guards/resource-policies.guard';
import { CheckResource } from '../casl/decorators/check-resource.decorator';

@ApiBearerAuth('access-token')
@ApiTags('IAM / Memberships')
@UseGuards(JwtAuthGuard)
@Controller('iam/memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('groups/:groupId/members')
  @ApiOperation({
    summary: 'Add user to group',
    description:
      'Adds a user to the specified group. This will grant the user all permissions associated with the group.',
  })
  addMember(
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
  ): Promise<MembershipResponse> {
    return this.membershipService.addMember(groupId, dto.userId);
  }

  @Get('groups/:groupId/members')
  @ApiOperation({
    summary: 'List group members',
    description: 'Returns all users who are members of the specified group.',
  })
  getGroupMembers(@Param('groupId') groupId: string) {
    return this.membershipService.getGroupMembers(groupId);
  }

  @Delete('groups/:groupId/members/:userId')
  @ApiOperation({
    summary: 'Remove user from group',
    description:
      'Removes a user from the specified group. This will revoke all permissions associated with the group.',
  })
  removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ): Promise<MembershipResponse> {
    return this.membershipService.removeMember(groupId, userId);
  }

  @Get('users/:userId/groups')
  @ApiOperation({
    summary: 'Get user groups',
    description: 'Returns all groups that the specified user is a member of.',
  })
  getUserGroups(@Param('userId') userId: string) {
    return this.membershipService.getUserGroups(userId);
  }
}
