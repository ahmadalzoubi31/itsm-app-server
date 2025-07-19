import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ServiceCardsService } from './service-cards.service';
import { CreateServiceCardDto } from './dto/create-service-card.dto';
import { UpdateServiceCardDto } from './dto/update-service-card.dto';

@Controller('service-cards')
export class ServiceCardsController {
  constructor(private readonly serviceCardsService: ServiceCardsService) {}

  @Post()
  create(@Body() createServiceCardDto: CreateServiceCardDto) {
      return this.serviceCardsService.create(createServiceCardDto);
  }

  @Get()
  findAll() {
    return this.serviceCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceCardsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceCardDto: UpdateServiceCardDto,
  ) {
    return this.serviceCardsService.update(+id, updateServiceCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceCardsService.remove(+id);
  }
}
