import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Working on the issue.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  // isPrivate field removed - all comments are now shared between request and case
}

