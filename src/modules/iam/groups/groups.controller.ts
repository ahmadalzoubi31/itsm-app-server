// src/modules/iam/groups/groups.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { Group } from './entities/group.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '../casl/guards/resource-policies.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CheckResource } from '../casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiBearerAuth('access-token')
@ApiTags('IAM / Groups')
@UseGuards(JwtAuthGuard)
@Controller('iam/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Group)
  @ApiOperation({ summary: 'Create a group' })
  createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Group)
  @ApiOperation({ summary: 'List groups' })
  listGroups() {
    return this.groupsService.listGroups();
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Get group by id' })
  getGroup(@Param('id') id: string) {
    return this.groupsService.getGroup(id);
  }

  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Update group' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.updateGroup(id, dto);
  }

  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Delete, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@Param('id') id: string) {
    return this.groupsService.deleteGroup(id);
  }

  @Post(':id/members')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Add users to group' })
  addUsersToGroup(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.groupsService.addUsersToGroup(id, body.userIds);
  }

  @Delete(':id/members')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Remove users from group' })
  removeUsersFromGroup(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.groupsService.removeUsersFromGroup(id, body.userIds);
  }

  @Get(':id/members')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, GroupsService, 'getGroup')
  @ApiOperation({ summary: 'Get group members' })
  getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembers(id);
  }
}
