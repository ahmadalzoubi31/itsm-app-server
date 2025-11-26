// src/modules/case-subcategory/dto/create-case-subcategory.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateCaseSubcategoryDto {
  @ApiProperty({
    description: 'Unique key identifier (lowercase, kebab-case)',
    example: 'hardware',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must be lowercase alphanumeric with hyphens only',
  })
  key!: string;

  @ApiProperty({
    description: 'Display name of the case subcategory',
    example: 'Hardware',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'ID of the parent case category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the case subcategory',
    example: 'Issues related to computer hardware components',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

