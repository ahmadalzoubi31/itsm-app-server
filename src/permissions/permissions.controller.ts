import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { AppAbility } from '../casl/casl-ability.factory';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/enums/action.enum';
import { Permission } from './entities/permission.entity';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Permission))
  async findAll() {
    return await this.permissionsService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Permission))
  async findOne(@Param('id') id: string) {
    return await this.permissionsService.findAll();
  }

  @Post('assign')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, Permission),
  )
  async assign(@Body() assignPermissionDto: AssignPermissionDto) {
    return await this.permissionsService.assign(assignPermissionDto);
  }

  @Delete('un-assign')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, Permission),
  )
  async unAssign(@Body() assignPermissionDto: AssignPermissionDto) {
    return await this.permissionsService.unAssign(assignPermissionDto);
  }
}
