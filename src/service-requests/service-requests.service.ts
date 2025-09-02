import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequest } from './entities/service-request.entity';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async create(createServiceRequestDto: CreateServiceRequestDto) {
    const serviceRequest = this.serviceRequestRepository.create(
      createServiceRequestDto,
    );
    return await this.serviceRequestRepository.save(serviceRequest);
  }

  async findAll() {
    return await this.serviceRequestRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    return await this.serviceRequestRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateServiceRequestDto: UpdateServiceRequestDto) {
    await this.serviceRequestRepository.update(id, updateServiceRequestDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    return await this.serviceRequestRepository.delete(id);
  }
}
