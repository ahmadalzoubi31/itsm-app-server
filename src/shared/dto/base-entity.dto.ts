import { IsDate, IsEnum, IsString, IsUUID } from 'class-validator';

export class BaseEntityDto {
  @IsString()
  @IsUUID()
  createdById: string;

  @IsString()
  @IsUUID()
  updatedById: string;
}
