// src/modules/iam/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { User } from './entities/user.entity';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { CheckResource } from '../casl/decorators/check-resource.decorator';
import { ResourcePoliciesGuard } from '../casl/guards/resource-policies.guard';

@ApiTags('IAM / Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('iam/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {
    this.logger.log('UsersController initialized');
  }

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, User)
  @ApiOperation({ summary: 'Create a user' })
  createUser(@CurrentUser() user, @Body() dto: CreateUserDto) {
    this.logger.log(`Creating user by ${user.username} (${user.userId})`);
    return this.usersService.createUser({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, User)
  @ApiOperation({ summary: 'List users' })
  listUsers() {
    this.logger.debug('Listing all users');
    return this.usersService.listUsers();
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Manage, UsersService, 'getUser', 'id')
  @ApiOperation({ summary: 'Get user by id' })
  getUser(@Param('id') id: string) {
    this.logger.debug(`Getting user ${id}`);
    return this.usersService.getUser(id);
  }

  @Patch(':id')
  @UseGuards(ResourcePoliciesGuard, AbilityGuard)
  @CheckResource(IAM_ACTIONS.Manage, UsersService, 'getUser', 'id')
  @CheckAbility(IAM_ACTIONS.Manage, User)
  @ApiOperation({ summary: 'Update user' })
  updateUser(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }

  @Delete(':id')
  @UseGuards(ResourcePoliciesGuard, AbilityGuard)
  @CheckResource(IAM_ACTIONS.Manage, UsersService, 'getUser', 'id')
  @CheckAbility(IAM_ACTIONS.Manage, User)
  @ApiOperation({ summary: 'Soft delete user' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
