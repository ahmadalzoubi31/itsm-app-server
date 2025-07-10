import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IncidentHelper } from './helpers/incident.helper';
import { ImpactEnum } from './constants/impact.constant';
import { UrgencyEnum } from './constants/urgency.constant';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    private incidentHelper: IncidentHelper,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    // Calculate priority based on impact and urgency
    const priority = this.incidentHelper.calculatePriority(
      createIncidentDto.impact,
      createIncidentDto.urgency,
    );

    // Create incident with calculated priority
    const incident = this.incidentRepository.create({
      ...createIncidentDto,
      priority,
    });

    try {
      return await this.incidentRepository.save(incident);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    // Update the incident fields
    Object.assign(incident, updateIncidentDto);

    try {
      return await this.incidentRepository.save({
        ...incident,
        ...updateIncidentDto,
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    try {
      return await this.incidentRepository.remove(incident);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    try {
      return await this.incidentRepository.find({
        relations: ['comments', 'histories', 'createdBy', 'updatedBy'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string) {
    try {
      return await this.incidentRepository.findOne({
        where: { id },
        relations: ['comments', 'histories', 'createdBy', 'updatedBy'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
