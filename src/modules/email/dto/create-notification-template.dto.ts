import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty({
    description: 'Business Line ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  businessLineId!: string;

  @ApiProperty({
    description: 'Template key identifier',
    example: 'case.created',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'Email subject template with Handlebars variables',
    example: 'New Case #{{case.number}} Created',
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    description: 'HTML body template with Handlebars variables',
    example:
      '<h1>Case {{case.number}} has been created</h1><p>Status: {{case.status}}</p>',
  })
  @IsString()
  @IsNotEmpty()
  bodyHtml!: string;
}
