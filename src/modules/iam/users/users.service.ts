import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Group } from '../groups/entities/group.entity';
import { Membership } from '../groups/entities/membership.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.users.create(dto);
    const username = user.username.trim().toLowerCase();
    user.username = username;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    return await this.users.save(user);
  }

  async listUsers(options?: FindOptionsWhere<User>): Promise<User[]> {
    return await this.users.find({
      where: options,
      order: { username: 'ASC' },
      relations: ['roles', 'permissions'],
    });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.users.findOne({
      where: { id },
      relations: ['roles', 'permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getUser(id);
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }

    Object.assign(user, dto);

    return await this.users.save(user);
  }

  async deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
    const user = await this.getUser(id);
    await this.users.delete({ id });
    return { id, deleted: true };
  }

  /**
   * Gets all groups for a user
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const membershipRecords = await this.memberships.find({
      where: { userId },
      relations: ['group', 'group.businessLine'],
      order: { createdAt: 'ASC' },
    });

    return membershipRecords.map((m) => m.group);
  }
}
