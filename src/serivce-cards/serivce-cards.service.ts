import { Injectable } from '@nestjs/common';
import { CreateSerivceCardDto } from './dto/create-serivce-card.dto';
import { UpdateSerivceCardDto } from './dto/update-serivce-card.dto';

@Injectable()
export class SerivceCardsService {
  create(createSerivceCardDto: CreateSerivceCardDto) {
    return 'This action adds a new serivceCard';
  }

  findAll() {
    return `This action returns all serivceCards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serivceCard`;
  }

  update(id: number, updateSerivceCardDto: UpdateSerivceCardDto) {
    return `This action updates a #${id} serivceCard`;
  }

  remove(id: number) {
    return `This action removes a #${id} serivceCard`;
  }
}
