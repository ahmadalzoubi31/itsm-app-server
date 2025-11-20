import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Working on the issue.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({
    example: true,
    description: 'If true, comment is private (visible to all with case access). If false, shared (visible to requester).',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
