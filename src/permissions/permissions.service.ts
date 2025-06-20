import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(assignPermissionDto: AssignPermissionDto) {
    try {
      // Check if the user already exist
      const user = await this.usersRepository.findOneBy({
        id: assignPermissionDto.userId,
      });

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }

      // Check if the user already has the permission
      const existingPermission = await this.permissionsRepository.findOneBy({
        name: assignPermissionDto.name,
        user: {
          id: assignPermissionDto.userId,
        },
      });

      if (existingPermission) {
        throw new InternalServerErrorException(
          'User already has this permission',
        );
      }

      const permission = this.permissionsRepository.create(assignPermissionDto);
      permission.user = user;

      return await this.permissionsRepository.save(permission);
    } catch (error: any) {
      console.log('🚀 ~ PermissionsService ~ create ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(assignPermissionDto: AssignPermissionDto) {
    try {
      // Check if the user already exist
      const user = await this.usersRepository.findOneBy({
        id: assignPermissionDto.userId,
      });

      if (!user) {
        throw new InternalServerErrorException('User not found');
      }

      // Check if the user already has the permission
      const existingPermission = await this.permissionsRepository.findOneBy({
        name: assignPermissionDto.name,
        user: {
          id: assignPermissionDto.userId,
        },
      });

      if (!existingPermission) {
        throw new InternalServerErrorException('User not has this permission');
      }

      return await this.permissionsRepository.remove(existingPermission);
    } catch (error: any) {
      console.log('🚀 ~ PermissionsService ~ create ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    return await this.permissionsRepository.find({
      relations: ['user'],
    });
  }
}
