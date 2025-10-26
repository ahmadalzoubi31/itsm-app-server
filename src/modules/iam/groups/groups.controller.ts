// src/modules/iam/groups/groups.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { Group } from './entities/group.entity';
import { CheckResource } from '../casl/decorators/check-resource.decorator';
import { ResourcePoliciesGuard } from '../casl/guards/resource-policies.guard';

@ApiBearerAuth('access-token')
@ApiTags('IAM / Groups')
@UseGuards(JwtAuthGuard)
@Controller('iam/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, Group)
  @ApiOperation({ summary: 'Create a group' })
  createGroup(@CurrentUser() user, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, Group)
  @ApiOperation({ summary: 'List groups' })
  listGroups() {
    return this.groupsService.listGroups();
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Manage, GroupsService, 'getGroup', 'id')
  @ApiOperation({ summary: 'Get group by id' })
  getGroup(@Param('id') id: string) {
    return this.groupsService.getGroup(id);
  }

  @Patch(':id')
  @UseGuards(ResourcePoliciesGuard, AbilityGuard)
  @CheckResource(IAM_ACTIONS.Manage, GroupsService, 'getGroup', 'id')
  @CheckAbility(IAM_ACTIONS.Manage, Group)
  @ApiOperation({ summary: 'Update group' })
  updateGroup(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }

  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard, AbilityGuard)
  @CheckResource(IAM_ACTIONS.Manage, GroupsService, 'getGroup', 'id')
  @CheckAbility(IAM_ACTIONS.Manage, Group)
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@Param('id') id: string) {
    return this.groupsService.deleteGroup(id);
  }
}
