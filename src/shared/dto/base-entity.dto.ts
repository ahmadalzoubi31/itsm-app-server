import { IsDate, IsEnum, IsString, IsUUID } from 'class-validator';

export class BaseEntityDto {
  @IsString()
  @IsEnum({ enum: ['active', 'inactive'] })
  status: string;

  @IsString()
  @IsUUID()
  createdById: string;

  @IsString()
  @IsUUID()
  updatedById: string;
}
