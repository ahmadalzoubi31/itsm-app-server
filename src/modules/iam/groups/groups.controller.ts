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
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiBearerAuth('access-token')
@ApiTags('IAM / Groups')
@UseGuards(JwtAuthGuard)
@Controller('iam/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a group' })
  createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups' })
  listGroups() {
    return this.groupsService.listGroups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by id' })
  getGroup(@Param('id') id: string) {
    return this.groupsService.getGroup(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update group' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.updateGroup(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@Param('id') id: string) {
    return this.groupsService.deleteGroup(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add users to group' })
  addUsersToGroup(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.groupsService.addUsersToGroup(id, body.userIds);
  }

  @Delete(':id/members')
  @ApiOperation({ summary: 'Remove users from group' })
  removeUsersFromGroup(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.groupsService.removeUsersFromGroup(id, body.userIds);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get group members' })
  getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembers(id);
  }
}
