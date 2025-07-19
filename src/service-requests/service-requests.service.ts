import { Injectable } from '@nestjs/common';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  create(createServiceRequestDto: CreateServiceRequestDto) {
    return 'This action adds a new serivceRequest';
  }

  findAll() {
    return `This action returns all serivceRequests`;
  }

  findOne(id: string) {
    return `This action returns a #${id} serivceRequest`;
  }

  update(id: string, updateServiceRequestDto: UpdateServiceRequestDto) {
    return `This action updates a #${id} serivceRequest`;
  }

  remove(id: string) {
    return `This action removes a #${id} serivceRequest`;
  }
}
