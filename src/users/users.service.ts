import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);

    try {
      return await this.usersRepository.save(user);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Extract password separately to handle it specially
    const { password, ...otherFields } = updateUserDto;

    // Update non-password fields
    Object.assign(user, otherFields);

    // Only update password if it's provided as a non-empty string
    if (password !== undefined && password !== null && password !== '') {
      user.password = password;
    }

    try {
      return await this.usersRepository.save(user);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.usersRepository.delete(id);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        relations: ['permissions', 'createdBy', 'updatedBy'],
        order: {
          createdAt: 'DESC',
        },
        where: {
          id: Not('0745bd13-92f2-474e-8544-5018383c7b75'),
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        where: {
          id: In(ids),
          username: Not('system'),
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { id, username: Not('system') },
        relations: ['permissions', 'createdBy', 'updatedBy'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { username, id: Not('0745bd13-92f2-474e-8544-5018383c7b75') },
        relations: ['permissions', 'createdBy', 'updatedBy'],
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneWithGroupPermissions(id: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, username: Not('system') },
        relations: ['permissions', 'createdBy', 'updatedBy'],
      });

      if (!user) {
        return null;
      }

      // Get group permissions
      const groupPermissions = await this.getUserGroupPermissions(id);

      // Combine user permissions with group permissions
      const allPermissions = this.combinePermissions(
        user.permissions || [],
        groupPermissions,
      );
      user.permissions = allPermissions;

      return user;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByUsernameWithGroupPermissions(
    username: string,
  ): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { username, id: Not('0745bd13-92f2-474e-8544-5018383c7b75') },
        relations: ['permissions', 'createdBy', 'updatedBy'],
      });

      if (!user) {
        return null;
      }

      // Get group permissions
      const groupPermissions = await this.getUserGroupPermissions(user.id);

      // Combine user permissions with group permissions
      const allPermissions = this.combinePermissions(
        user.permissions || [],
        groupPermissions,
      );
      user.permissions = allPermissions;

      return user;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUserGroupPermissions(userId: string): Promise<Permission[]> {
    try {
      const userGroups = await this.groupMemberRepository.find({
        where: { userId, isActive: true },
        relations: ['group', 'group.permissions'],
      });

      const allPermissions: Permission[] = [];
      const seenPermissionIds = new Set<string>();

      for (const membership of userGroups) {
        if (membership.group?.permissions) {
          for (const permission of membership.group.permissions) {
            if (!seenPermissionIds.has(permission.id)) {
              seenPermissionIds.add(permission.id);
              allPermissions.push(permission);
            }
          }
        }
      }

      return allPermissions;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getEffectiveUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await this.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const groupPermissions = await this.getUserGroupPermissions(userId);
      return this.combinePermissions(user.permissions || [], groupPermissions);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private combinePermissions(
    userPermissions: Permission[],
    groupPermissions: Permission[],
  ): Permission[] {
    const allPermissions: Permission[] = [...userPermissions];
    const seenPermissionIds = new Set<string>(userPermissions.map((p) => p.id));

    for (const permission of groupPermissions) {
      if (!seenPermissionIds.has(permission.id)) {
        seenPermissionIds.add(permission.id);
        allPermissions.push(permission);
      }
    }

    return allPermissions;
  }
}
