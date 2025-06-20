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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, User))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, User))
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
