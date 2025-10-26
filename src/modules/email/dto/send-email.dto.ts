import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class SendEmailDto {
  @ApiProperty() @IsEmail() to!: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() html!: string;
}
