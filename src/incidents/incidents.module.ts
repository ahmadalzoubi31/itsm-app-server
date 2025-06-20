import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from './entities/incident.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { IncidentHistory } from './entities/incident-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentHelper } from './helpers/incident.helper';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Incident, IncidentComment, IncidentHistory]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentHelper, CaslAbilityFactory],
})
export class IncidentsModule {}
