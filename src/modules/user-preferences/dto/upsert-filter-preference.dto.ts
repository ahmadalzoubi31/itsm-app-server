// src/modules/user-preferences/dto/upsert-filter-preference.dto.ts
import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FacetedFilterConfig {
  columnKey: string;
  title: string;
  options: FilterOption[];
}

export class UpsertFilterPreferenceDto {
  @ApiProperty({
    description: 'Unique key identifying the filter preference',
    example: 'cases-table-columns-filters',
  })
  @IsString()
  preferenceKey!: string;

  @ApiProperty({
    description: 'Filter configurations',
    example: [
      {
        columnKey: 'status',
        title: 'Status',
        options: [
          { label: 'New', value: 'New' },
          { label: 'In Progress', value: 'InProgress' },
        ],
      },
    ],
  })
  @IsArray()
  filters!: FacetedFilterConfig[];
}

