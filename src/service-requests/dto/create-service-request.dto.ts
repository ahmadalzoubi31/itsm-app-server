import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateServiceRequestDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  serviceCardId?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;

  @IsOptional()
  @IsString()
  requestedDate?: string;

  @IsOptional()
  @IsString()
  estimatedCompletion?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsObject()
  customFieldValues?: any;
}
