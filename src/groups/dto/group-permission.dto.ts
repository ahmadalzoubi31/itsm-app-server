import { IsUUID, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class AddPermissionToGroupDto extends BaseEntityDto {
  @IsUUID()
  permissionId: string;
}

export class RemovePermissionFromGroupDto {
  @IsUUID()
  permissionId: string;
}

export class SetGroupPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
