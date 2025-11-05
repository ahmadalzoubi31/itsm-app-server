// src/modules/catalog/dto/update-template.dto.ts
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  jsonSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  uiSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  defaults?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultAssignmentGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  businessLineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
