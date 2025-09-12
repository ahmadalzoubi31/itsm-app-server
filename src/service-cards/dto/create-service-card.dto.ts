import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
  IsUUID,
} from 'class-validator';
import {
  ServiceCardStatus,
  ServiceCardVisibility,
} from '../entities/service-card.entity';

export class CreateServiceCardDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string; // reference to ServiceCategory

  @IsEnum(ServiceCardStatus)
  @IsOptional()
  status?: ServiceCardStatus = ServiceCardStatus.DRAFT;

  @IsEnum(ServiceCardVisibility)
  @IsOptional()
  visibility?: ServiceCardVisibility = ServiceCardVisibility.INTERNAL;

  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @IsString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsOptional()
  isActive?: boolean = true;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  requestFormSchema?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  approvalWorkflowId?: string; // reference to ApprovalWorkflow

  @IsUUID()
  @IsOptional()
  slaId?: string; // reference to SLA

  @IsUUID()
  @IsOptional()
  assignedGroupId?: string; // reference to Group

  @IsString()
  @IsOptional()
  supportContact?: string;
}
