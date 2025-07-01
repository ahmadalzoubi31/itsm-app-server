import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SerivceCardsService } from './serivce-cards.service';
import { CreateSerivceCardDto } from './dto/create-serivce-card.dto';
import { UpdateSerivceCardDto } from './dto/update-serivce-card.dto';

@Controller('serivce-cards')
export class SerivceCardsController {
  constructor(private readonly serivceCardsService: SerivceCardsService) {}

  @Post()
  create(@Body() createSerivceCardDto: CreateSerivceCardDto) {
    return this.serivceCardsService.create(createSerivceCardDto);
  }

  @Get()
  findAll() {
    return this.serivceCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serivceCardsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSerivceCardDto: UpdateSerivceCardDto,
  ) {
    return this.serivceCardsService.update(+id, updateSerivceCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serivceCardsService.remove(+id);
  }
}
