import { Injectable } from '@nestjs/common';
import { CreateSerivceRequestDto } from './dto/create-serivce-request.dto';
import { UpdateSerivceRequestDto } from './dto/update-serivce-request.dto';

@Injectable()
export class SerivceRequestsService {
  create(createSerivceRequestDto: CreateSerivceRequestDto) {
    return 'This action adds a new serivceRequest';
  }

  findAll() {
    return `This action returns all serivceRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serivceRequest`;
  }

  update(id: number, updateSerivceRequestDto: UpdateSerivceRequestDto) {
    return `This action updates a #${id} serivceRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} serivceRequest`;
  }
}
