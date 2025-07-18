import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupFiltersDto } from './dto/group-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditFieldsInterceptor } from 'src/shared/interceptors/audit-fields.interceptor';
import { PoliciesGuard } from 'src/casl/guards/policies.guard';
import { Action } from 'src/casl/enums/action.enum';
import { AppAbility } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Group } from './entities/group.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AddMembersBatchDto } from './dto/add-members-batch.dto';
import {
  AddPermissionToGroupDto,
  RemovePermissionFromGroupDto,
  SetGroupPermissionsDto,
} from './dto/group-permission.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditFieldsInterceptor)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Group))
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Group))
  findAll(@Query() filters: GroupFiltersDto) {
    return this.groupsService.findAll(filters);
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Group))
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Group))
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  // Group Members endpoints
  @Get(':id/members')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Group))
  getGroupMembers(@Param('id') id: string) {
    return this.groupsService.getGroupMembers(id);
  }

  @Post(':id/members')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.groupsService.addMember(id, addMemberDto);
  }

  @Post(':id/members/batch')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  addMembersBatch(
    @Param('id') id: string,
    @Body() addMembersBatchDto: AddMembersBatchDto,
  ) {
    return this.groupsService.addMembersBatch(id, addMembersBatchDto);
  }

  @Patch(':id/members/:userId')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(id, userId, updateMemberRoleDto);
  }

  @Delete(':id/members/:userId')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(id, userId);
  }

  // Group Permissions endpoints
  @Get(':id/permissions')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Group))
  getGroupPermissions(@Param('id') id: string) {
    return this.groupsService.getGroupPermissions(id);
  }

  @Post(':id/permissions')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  addPermissionToGroup(
    @Param('id') id: string,
    @Body() addPermissionDto: AddPermissionToGroupDto,
  ) {
    return this.groupsService.addPermissionToGroup(
      id,
      addPermissionDto.permissionId,
    );
  }

  @Delete(':id/permissions/:permissionId')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  removePermissionFromGroup(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.groupsService.removePermissionFromGroup(id, permissionId);
  }

  @Patch(':id/permissions')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Group))
  setGroupPermissions(
    @Param('id') id: string,
    @Body() setPermissionsDto: SetGroupPermissionsDto,
  ) {
    return this.groupsService.setGroupPermissions(
      id,
      setPermissionsDto.permissionIds,
    );
  }
}
