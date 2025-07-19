import { Injectable } from '@nestjs/common';
import { CreateServiceCardDto } from './dto/create-service-card.dto';
import { UpdateServiceCardDto } from './dto/update-service-card.dto';

@Injectable()
export class ServiceCardsService {
  create(createServiceCardDto: CreateServiceCardDto) {
    return 'This action adds a new serviceCard';
  }

  findAll() {
    return `This action returns all serviceCards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serviceCard`;
  }

  update(id: number, updateServiceCardDto: UpdateServiceCardDto) {
    return `This action updates a #${id} serviceCard`;
  }

  remove(id: number) {
    return `This action removes a #${id} serviceCard`;
  }
}
