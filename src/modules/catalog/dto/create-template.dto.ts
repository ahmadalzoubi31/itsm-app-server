// src/modules/catalog/dto/create-template.dto.ts
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  @IsObject()
  @Type(() => Object)
  jsonSchema!: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  uiSchema?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  defaults?: any;

  @ApiProperty()
  @IsUUID()
  defaultAssignmentGroupId!: string;

  @ApiProperty()
  @IsUUID()
  businessLineId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
