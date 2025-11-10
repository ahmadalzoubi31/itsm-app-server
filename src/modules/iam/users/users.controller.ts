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
import { JwtAuthGuard } from '../auth/jwt.guard';

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
  @ApiOperation({
    summary: 'Create a user',
    description: 'Create a new user.',
  })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List users', description: 'Return all users.' })
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get(':id/groups')
  @ApiOperation({
    summary: 'Get user groups',
    description: 'Returns all groups that the specified user is a member of.',
  })
  getUserGroups(@Param('id') id: string) {
    return this.usersService.getUserGroups(id);
  }
}
