import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateUserNotifyPrefDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Event key identifier',
    example: 'case.created',
    required: false,
  })
  @IsString()
  @IsOptional()
  eventKey?: string;

  @ApiProperty({
    description: 'Notification channel',
    enum: ['email', 'webhook'],
    example: 'email',
    required: false,
  })
  @IsIn(['email', 'webhook'])
  @IsOptional()
  channel?: 'email' | 'webhook';

  @ApiProperty({
    description: 'Whether the notification is enabled',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
