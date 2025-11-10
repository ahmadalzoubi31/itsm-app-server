// src/modules/business-line/business-line.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { BusinessLineService } from './business-line.service';
import { CreateBusinessLineDto } from './dto/create-business-line.dto';
import { UpdateBusinessLineDto } from './dto/update-business-line.dto';

@ApiTags('Business Line')
@ApiBearerAuth('access-token')
@Controller('business-lines')
@UseGuards(JwtAuthGuard)
export class BusinessLineController {
  private readonly logger = new Logger(BusinessLineController.name);

  constructor(private readonly businessLineService: BusinessLineService) {
    this.logger.log('BusinessLineController initialized');
  }

  @ApiOperation({
    summary: 'List all business lines',
    description: 'Get all active business lines (HR, IT, Finance, etc.)',
  })
  @Get()
  findAll() {
    return this.businessLineService.findAll();
  }

  @ApiOperation({
    summary: 'Get business line by ID',
    description: 'Retrieve a specific business line',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessLineService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create business line',
    description: 'Admin: Create a new business line',
  })
  @Post()
  create(@Body() dto: CreateBusinessLineDto) {
    return this.businessLineService.create(dto);
  }

  @ApiOperation({
    summary: 'Update business line',
    description: 'Admin: Update an existing business line',
  })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessLineDto) {
    return this.businessLineService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Deactivate business line',
    description: 'Admin: Soft delete a business line',
  })
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.businessLineService.deactivate(id);
  }
}
