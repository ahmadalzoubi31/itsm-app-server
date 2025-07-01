import { IsUUID } from 'class-validator';

export class BaseEntityDto {
  @IsUUID()
  createdById: string;

  @IsUUID()
  updatedById: string;
}
