import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SlaService } from './sla.service';
import { CreateSlaDto } from './dto/create-sla.dto';
import { UpdateSlaDto } from './dto/update-sla.dto';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Post()
  create(@Body() createSlaDto: CreateSlaDto) {
    return this.slaService.create(createSlaDto);
  }

  @Get()
  findAll() {
    return this.slaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSlaDto: UpdateSlaDto) {
    return this.slaService.update(+id, updateSlaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slaService.remove(+id);
  }
}
