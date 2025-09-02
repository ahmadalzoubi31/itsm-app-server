import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  async create(@Body() createServiceRequestDto: CreateServiceRequestDto) {
    const data = await this.serviceRequestsService.create(
      createServiceRequestDto,
    );
    return {
      success: true,
      data,
      message: 'Service request created successfully',
    };
  }

  @Get()
  async findAll() {
    const data = await this.serviceRequestsService.findAll();
    return {
      success: true,
      data,
      message: 'Service requests retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.serviceRequestsService.findOne(id);
    return {
      success: true,
      data,
      message: 'Service request retrieved successfully',
    };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.update(id, updateServiceRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceRequestsService.remove(id);
  }
}
