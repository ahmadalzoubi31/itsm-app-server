import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async assign(assignPermissionDto: AssignPermissionDto) {
    const user = await this.usersRepository.existsBy({
      id: assignPermissionDto.userId,
    });

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    try {
      // Check if the user already has the permission
      const existingPermission = await this.permissionsRepository.findOne({
        where: {
          name: assignPermissionDto.name,
          userId: assignPermissionDto.userId,
        },
      });

      if (existingPermission) {
        throw new InternalServerErrorException(
          'User already has this permission',
        );
      }

      const permission = this.permissionsRepository.create(assignPermissionDto);
      permission.userId = assignPermissionDto.userId;

      return await this.permissionsRepository.save(permission);
    } catch (error) {
      console.log('🚀 ~ PermissionsService ~ create ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
