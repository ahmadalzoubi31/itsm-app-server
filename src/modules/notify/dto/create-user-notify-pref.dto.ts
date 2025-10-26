import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsIn } from 'class-validator';

export class CreateUserNotifyPrefDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Event key identifier',
    example: 'case.created',
  })
  @IsString()
  @IsNotEmpty()
  eventKey!: string;

  @ApiProperty({
    description: 'Notification channel',
    enum: ['email', 'webhook'],
    example: 'email',
  })
  @IsIn(['email', 'webhook'])
  @IsNotEmpty()
  channel!: 'email' | 'webhook';
}
