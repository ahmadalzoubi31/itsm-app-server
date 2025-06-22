import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { UsersService } from '../users/users.service';
import { PermissionName } from './enums/permission-name.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    private usersService: UsersService,
  ) {}

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

  async findByName(name: PermissionName): Promise<Permission | null> {
    try {
      return await this.permissionsRepository.findOne({
        where: { name: name },
        relations: ['users'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isUserHasPermission(
    userId: string,
    permissionId: string,
  ): Promise<boolean> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const permission = await this.permissionsRepository.findOne({
      where: {
        id: permissionId,
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

  async assign(assignPermissionDto: AssignPermissionDto) {
    try {
      // Check if the user already exist
      const user = await this.usersService.findOne(assignPermissionDto.userId);

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }

      // Check if the permission already exist
      const permission = await this.permissionsRepository.findOne({
        where: {
          id: assignPermissionDto.permissionId,
        },
        relations: ['users'],
      });

      if (!permission) {
        throw new InternalServerErrorException('Permission not found');
      }

      // Check if the user already has the permission
      const isUserHasPermission = await this.isUserHasPermission(
        assignPermissionDto.userId,
        assignPermissionDto.permissionId,
      );

      if (isUserHasPermission) {
        throw new InternalServerErrorException(
          'User already has this permission',
        );
      }

      permission.users.push(user);

      return await this.permissionsRepository.save(permission);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async unAssign(assignPermissionDto: AssignPermissionDto) {
    try {
      // Check if the user already exist
      const user = await this.usersService.findOne(assignPermissionDto.userId);

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }

      // Check if the permission already exist
      const permission = await this.permissionsRepository.findOne({
        where: {
          id: assignPermissionDto.permissionId,
        },
        relations: ['users'],
      });

      if (!permission) {
        throw new InternalServerErrorException('Permission not found');
      }

      // Check if the user already has the permission
      const isUserHasPermission = await this.isUserHasPermission(
        assignPermissionDto.userId,
        assignPermissionDto.permissionId,
      );

      if (!isUserHasPermission) {
        throw new InternalServerErrorException('User has not this permission');
      }

      // remove the element from array
      permission.users = permission.users.filter((item) => item.id !== user.id);

      return await this.permissionsRepository.save(permission);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
