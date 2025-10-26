import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateNotificationTemplateDto {
  @ApiProperty({
    description: 'Email subject template with Handlebars variables',
    example: 'Updated Case #{{case.number}}',
    required: false,
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'HTML body template with Handlebars variables',
    example: '<h1>Updated Case {{case.number}}</h1><p>New content here</p>',
    required: false,
  })
  @IsString()
  @IsOptional()
  bodyHtml?: string;
}
