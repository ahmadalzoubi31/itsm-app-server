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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuditFieldsInterceptor } from 'src/shared/interceptors/audit-fields.interceptor';
import { PoliciesGuard } from 'src/casl/guards/policies.guard';
import { AppAbility } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/casl/decorators/check-policies.decorator';
import { Incident } from './entities/incident.entity';
import { Action } from 'src/casl/enums/action.enum';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditFieldsInterceptor)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Incident))
  create(@Body() createIncidentDto: CreateIncidentDto) {
    try {
      return this.incidentsService.create(createIncidentDto);
    } catch (error) {
      throw new Error('Failed to create incident');
    }
  }

  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Incident))
  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Incident))
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Incident))
  update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Incident))
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
