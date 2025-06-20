import { IsEmpty, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';
import { Impact } from '../enums/impact.enum';
import { Urgency } from '../enums/urgency.enum';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class CreateIncidentDto extends BaseEntityDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsString()
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @IsString()
  @IsEnum(Impact)
  impact: Impact;

  @IsString()
  @IsEnum(Urgency)
  urgency: Urgency;

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
