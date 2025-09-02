import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ServiceCardCategoryEnum } from '../constants/category.constant';

export class CreateServiceCardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ServiceCardCategoryEnum)
  category: ServiceCardCategoryEnum;

  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @IsString()
  price: string;

  @IsOptional()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // @IsOptional()
  // @IsObject()
  // config?: Record<string, any>;
}
