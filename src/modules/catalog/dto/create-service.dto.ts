// src/modules/catalog/dto/create-service.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'it-helpdesk' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'IT Helpdesk' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'General IT support' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: true,
    description: 'Business line ID (IT, HR, Finance, etc.)',
  })
  @IsUUID()
  businessLineId!: string;
}
