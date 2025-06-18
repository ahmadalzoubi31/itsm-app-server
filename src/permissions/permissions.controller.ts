import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PoliciesGuard } from 'src/casl/guards/policies.guard';
import { AppAbility } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Action } from 'src/casl/enums/action.enum';
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

  @Post('assign')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, Permission),
  )
  async assign(@Body() assignPermissionDto: AssignPermissionDto) {
    return await this.permissionsService.create(assignPermissionDto);
  }

  @Delete('un-assign')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Delete, Permission),
  )
  async unAssign(@Body() assignPermissionDto: AssignPermissionDto) {
    return await this.permissionsService.delete(assignPermissionDto);
  }
}
