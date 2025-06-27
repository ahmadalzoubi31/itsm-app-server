import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { In, Repository } from 'typeorm';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UsersService } from '../users/users.service';
import { PermissionNameEnum } from './contants/permission-name.constant';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    private usersService: UsersService,
  ) {}

  async assign(dto: AssignPermissionDto) {
    const user = await this.usersService.findOne(dto.userId);
    if (!user) throw new InternalServerErrorException('User not found');

    const permissions = await this.permissionsRepository.find({
      where: { name: In(dto.permissionNames) },
    });
    if (!permissions.length)
      throw new InternalServerErrorException('Permission not found');

    const permissionIds = permissions.map((permission) => permission.id);
    const existingPermissionIds = user.permissions.map((p) => p.id);

    // Only add new permissions
    const toAddPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.includes(id),
    );

    // Remove user from all old permissions
    if (existingPermissionIds.length > 0) {
      await this.permissionsRepository
        .createQueryBuilder()
        .relation(Permission, 'users')
        .of(existingPermissionIds)
        .remove(dto.userId);
    }

    // Add user to all new permissions
    if (permissionIds.length > 0) {
      await this.permissionsRepository
        .createQueryBuilder()
        .relation(Permission, 'users')
        .of(permissionIds)
        .add(dto.userId);
    }

    return {
      message: `User assigned to ${toAddPermissionIds.length} new permissions.`,
    };
  }

  async isUserHasPermission(
    userId: string,
    permissionNames: string[],
  ): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const permission = await this.permissionsRepository.findOne({
      where: {
        name: In(permissionNames),
        users: {
          id: userId,
        },
      },
    });

    if (!permission) {
      return false;
    }

    return true;
  }

  async unAssign(assignPermissionDto: AssignPermissionDto) {
    // Find user
    const user = await this.usersService.findOne(assignPermissionDto.userId);
    if (!user) throw new InternalServerErrorException('User not found');

    // Find permissions by name
    const permissions = await this.permissionsRepository.find({
      where: { name: In(assignPermissionDto.permissionNames) },
    });
    if (!permissions.length)
      throw new InternalServerErrorException('Permission not found');

    // Permission IDs to remove
    const permissionIds = permissions.map((p) => p.id);

    // Only try to remove permissions the user already has
    const existingPermissionIds = user.permissions.map((p) => p.id);

    // Only remove if the user has these permissions
    const toRemovePermissionIds = permissionIds.filter((id) =>
      existingPermissionIds.includes(id),
    );

    if (toRemovePermissionIds.length > 0) {
      await this.permissionsRepository
        .createQueryBuilder()
        .relation(User, 'permissions')
        .of(assignPermissionDto.userId)
        .remove(toRemovePermissionIds);
    }

    return {
      message: `User unassigned from ${toRemovePermissionIds.length} permissions.`,
    };
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionsRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: string): Promise<Permission | null> {
    try {
      return await this.permissionsRepository.findOne({
        where: { id },
        relations: ['users'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByName(name: PermissionNameEnum): Promise<Permission | null> {
    try {
      return await this.permissionsRepository.findOne({
        where: { name: name },
        relations: ['users'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
