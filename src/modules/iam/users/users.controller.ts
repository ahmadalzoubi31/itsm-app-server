// src/modules/iam/users/users.controller.ts
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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '../casl/guards/resource-policies.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CheckResource } from '../casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('IAM / Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('iam/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.logger.log('UsersController initialized');
  }

  // -------- Users CRUD --------
  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, User)
  @ApiOperation({
    summary: 'Create a user',
    description: 'Create a new user.',
  })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, User)
  @ApiOperation({ summary: 'List users', description: 'Return all users.' })
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, UsersService, 'getUser')
  @ApiOperation({ summary: 'Get user by id' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, UsersService, 'getUser')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Delete, UsersService, 'getUser')
  @ApiOperation({ summary: 'Soft delete user' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get(':id/groups')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, UsersService, 'getUser')
  @ApiOperation({
    summary: 'Get user groups',
    description: 'Returns all groups that the specified user is a member of.',
  })
  getUserGroups(@Param('id') id: string) {
    return this.usersService.getUserGroups(id);
  }
}
