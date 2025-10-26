// src/modules/catalog/dto/create-template.dto.ts
import { IsUUID, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'service-uuid' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: 'new-laptop' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'New Laptop Request' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: {
      type: 'object',
      properties: { model: { type: 'string' } },
      required: ['model'],
    },
  })
  jsonSchema!: any;

  @ApiProperty({ required: false })
  @IsOptional()
  uiSchema?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  defaults?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  defaultAssignmentGroupId?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
