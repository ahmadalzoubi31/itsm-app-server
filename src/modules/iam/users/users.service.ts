import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../permissions/entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserPermission } from './entities/user-permission.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '@shared/contracts/events';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(UserPermission)
    private readonly userPerms: Repository<UserPermission>,
  ) {}

  /**
   * Creates a new user with proper validation and default role assignment
   */
  async createUser(
    dto: CreateUserDto & { createdById?: string; createdByName?: string },
  ): Promise<User> {
    const username = dto.username.trim().toLowerCase();

    const user = this.users.create({
      ...dto,
      username,
      authSource: dto.authSource ?? 'local',
      createdById: dto.createdById,
      createdByName: dto.createdByName,
    });

    if (dto.password && user.authSource === 'local') {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const savedUser = await this.users.save(user);

    // Assign default "End User" role to new user
    const endUserRole = await this.roles.findOne({
      where: { key: 'end_user' },
    });

    if (endUserRole) {
      const userRole = this.userRoles.create({
        userId: savedUser.id,
        roleId: endUserRole.id,
      });
      await this.userRoles.save(userRole);
    }

    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(savedUser.id, {
        username: savedUser.username,
        email: savedUser.email,
        authSource: savedUser.authSource as 'local' | 'ldap' | 'sso',
        createdBy: savedUser.createdById,
        createdAt: savedUser.createdAt.toISOString(),
      }),
    );

    this.logger.log(`User ${savedUser.username} created successfully`);

    return savedUser;
  }

  /**
   * Lists all users with optional filtering
   */
  async listUsers(options?: FindOptionsWhere<User>): Promise<User[]> {
    this.logger.debug('Fetching all users...');
    this.logger.log('Users fetched successfully');
    return this.users.find({
      where: options,
      order: { username: 'ASC' },
    });
  }

  /**
   * Gets a user by ID with proper error handling
   */
  async getUser(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
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

  /**
   * Updates a user with validation
   */
  async updateUser(
    id: string,
    patch: UpdateUserDto & { updatedById?: string; updatedByName?: string },
  ): Promise<User> {
    // Validate user exists and get before state
    const before = await this.getUser(id);

    // Track if password is being changed
    const isPasswordChange = !!patch.password;
    let hashedPassword: string | undefined;

    // Handle password update
    if (patch.password) {
      hashedPassword = await bcrypt.hash(patch.password, 10);
      delete patch.password; // Remove plain password from update
    }

    // Prepare update payload
    const updatePayload: any = {
      ...patch,
      updatedById: patch.updatedById,
      updatedByName: patch.updatedByName,
    };

    if (hashedPassword) {
      updatePayload.passwordHash = hashedPassword;
    }

    await this.users.update({ id }, updatePayload);
    const updated = await this.getUser(id);

    return updated;
  }

  /**
   * Deletes a user with proper cleanup
   */
  async deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
    // Validate user exists and capture data for event
    const user = await this.getUser(id);

    // Delete user roles first
    await this.userRoles.delete({ userId: id });

    // Delete user permissions
    await this.userPerms.delete({ userId: id });

    // Delete user
    await this.users.delete({ id });

    return { id, deleted: true };
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoles.find({ where: { userId } });
  }

  // Direct permission not related to role
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.userPerms.find({ where: { userId } });
  }
}
