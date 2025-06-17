import { Injectable } from '@nestjs/common';
import { CreateSlaDto } from './dto/create-sla.dto';
import { UpdateSlaDto } from './dto/update-sla.dto';

@Injectable()
export class SlaService {
  create(createSlaDto: CreateSlaDto) {
    return 'This action adds a new sla';
  }

  findAll() {
    return `This action returns all sla`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sla`;
  }

  update(id: number, updateSlaDto: UpdateSlaDto) {
    return `This action updates a #${id} sla`;
  }

  remove(id: number) {
    return `This action removes a #${id} sla`;
  }
}
