// src/modules/user-preferences/dto/upsert-table-preference.dto.ts
import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertTablePreferenceDto {
  @ApiProperty({
    description: 'Unique key identifying the table preference',
    example: 'cases-table-columns',
  })
  @IsString()
  preferenceKey!: string;

  @ApiProperty({
    description: 'Column visibility preferences',
    example: { number: true, title: true, status: false },
  })
  @IsObject()
  preferences!: Record<string, any>;
}
