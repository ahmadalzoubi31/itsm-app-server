// src/modules/case-subcategory/dto/update-case-subcategory.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateCaseSubcategoryDto {
  @ApiPropertyOptional({
    description: 'Display name of the case subcategory',
    example: 'Hardware',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'ID of the parent case category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the case subcategory',
    example: 'Issues related to computer hardware components',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this case subcategory is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

