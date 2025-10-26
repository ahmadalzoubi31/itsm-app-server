// src/modules/catalog/dto/update-template.dto.ts
import { IsUUID, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  jsonSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  uiSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  defaults?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultAssignmentGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
