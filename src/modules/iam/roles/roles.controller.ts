import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { AssignRolesToUserDto } from './dto/assign-roles-to-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('IAM / Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('iam/roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {
    this.logger.log('RolesController initialized');
  }

  // -------- Roles CRUD --------
  @Get()
  @ApiOperation({ summary: 'List roles', description: 'Return all roles.' })
  listRoles() {
    return this.rolesService.listRoles();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Return role details by ID.',
  })
  getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create role', description: 'Create a new role.' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role', description: 'Update role by ID.' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role', description: 'Delete role by ID.' })
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // -------- User ↔ Role --------
  @Post('users/:userId/assign')
  @ApiOperation({
    summary: 'Assign roles to user',
    description: 'Upsert mapping user → role.',
  })
  assignRolesToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRolesToUserDto,
  ) {
    return this.rolesService.assignRolesToUser(userId, dto);
  }

  @Delete('users/:userId/revoke/:roleId')
  @ApiOperation({
    summary: 'Revoke role from user',
    description: 'Remove mapping user → role.',
  })
  revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.revokeRoleFromUser(userId, roleId);
  }
}
