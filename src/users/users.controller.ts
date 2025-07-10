import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppAbility } from '../casl/casl-ability.factory';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action } from '../casl/enums/action.enum';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/guards/policies.guard';
import { AuditFieldsInterceptor } from '../shared/interceptors/audit-fields.interceptor';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditFieldsInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, User))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log(
      '🚀 ~ UsersController ~ update ~ updateUserDto:',
      updateUserDto,
    );
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, User))
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
