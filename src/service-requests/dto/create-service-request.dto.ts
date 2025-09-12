// import { IsString, IsOptional, IsObject } from 'class-validator';

// export class CreateServiceRequestDto {
//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsString()
//   status?: string;

//   @IsOptional()
//   @IsString()
//   priority?: string;

//   @IsOptional()
//   @IsString()
//   category?: string;

//   @IsOptional()
//   @IsString()
//   serviceCardId?: string;

//   @IsOptional()
//   @IsString()
//   serviceName?: string;

//   @IsOptional()
//   @IsString()
//   title?: string;

//   @IsOptional()
//   @IsString()
//   requestedBy?: string;

//   @IsOptional()
//   @IsString()
//   requestedDate?: string;

//   @IsOptional()
//   @IsString()
//   estimatedCompletion?: string;

//   @IsOptional()
//   @IsString()
//   groupId?: string;

//   @IsOptional()
//   @IsObject()
//   customFieldValues?: any;
// }

import { IsUUID, IsOptional, IsEnum, IsObject } from 'class-validator';
import { RequestStatus } from '../constants/request-status.constant';

export class CreateServiceRequestDto {
  @IsUUID()
  serviceCardId: string;

  // Optional: admins might allow submitting on behalf of someone else
  @IsOptional()
  @IsUUID()
  requestedById?: string;

  // Optional override: normally auto-filled from ServiceCard
  @IsOptional()
  @IsUUID()
  assignedGroupId?: string;

  // Optional override: specific user in group
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus; // defaults to pending if not provided

  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;
}
