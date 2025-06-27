import { IsEmpty, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IncidentStatusEnum } from '../constants/incident-status.constant';
import { PriorityEnum } from '../constants/priority.constant';
import { ImpactEnum } from '../constants/impact.constant';
import { UrgencyEnum } from '../constants/urgency.constant';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class CreateIncidentDto extends BaseEntityDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsString()
  @IsEnum(IncidentStatusEnum)
  status: IncidentStatusEnum;

  @IsString()
  @IsEnum(PriorityEnum)
  priority: PriorityEnum;

  @IsString()
  @IsEnum(ImpactEnum)
  impact: ImpactEnum;

  @IsString()
  @IsEnum(UrgencyEnum)
  urgency: UrgencyEnum;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsString()
  subcategory: string;

  @IsString()
  resolution: string;

  @IsNotEmpty()
  @IsString()
  businessService: string;

  @IsString()
  location: string;
}
