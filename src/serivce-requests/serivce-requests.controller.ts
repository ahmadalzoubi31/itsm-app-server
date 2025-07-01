import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SerivceRequestsService } from './serivce-requests.service';
import { CreateSerivceRequestDto } from './dto/create-serivce-request.dto';
import { UpdateSerivceRequestDto } from './dto/update-serivce-request.dto';

@Controller('serivce-requests')
export class SerivceRequestsController {
  constructor(private readonly serivceRequestsService: SerivceRequestsService) {}

  @Post()
  create(@Body() createSerivceRequestDto: CreateSerivceRequestDto) {
    return this.serivceRequestsService.create(createSerivceRequestDto);
  }

  @Get()
  findAll() {
    return this.serivceRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serivceRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSerivceRequestDto: UpdateSerivceRequestDto) {
    return this.serivceRequestsService.update(+id, updateSerivceRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serivceRequestsService.remove(+id);
  }
}
