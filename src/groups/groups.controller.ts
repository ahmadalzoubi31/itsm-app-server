import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UseInterceptors } from '@nestjs/common';
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
}
