// src/modules/catalog/dto/submit-catalog-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsObject } from 'class-validator';

export class SubmitCatalogRequestDto {
  @ApiProperty({
    description: 'Form data submitted by the user',
    example: {
      softwareName: 'Adobe Photoshop',
      businessJustification: 'Design team needs for creative projects',
      urgency: 'Medium',
    },
  })
  @IsObject()
  formData!: Record<string, any>;
}

