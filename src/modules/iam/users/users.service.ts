import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserPermission } from './entities/user-permission.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
    @InjectRepository(RolePermission)
    private readonly rolePerms: Repository<RolePermission>,
  ) {}

  /**
   * Creates a new user with proper validation and default role assignment
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const username = dto.username.trim().toLowerCase();

    const user = this.users.create({
      ...dto,
      username,
      authSource: dto.authSource ?? 'local',
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
    const user = await this.users
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Fetch roles directly using raw query to exclude audit fields
    const rolesRaw = await this.userRoles
      .createQueryBuilder('userRoles')
      .leftJoin('userRoles.role', 'role')
      .where('userRoles.userId = :id', { id })
      .select(['role.id', 'role.key', 'role.name', 'role.description'])
      .getRawMany();

    // Map raw results to role objects (excluding audit fields)
    // Filter out end_user role from UI
    (user as any).userRoles = rolesRaw
      .map((row) => ({
        id: row.role_id,
        key: row.role_key,
        name: row.role_name,
        description: row.role_description,
      }))
      .filter(
        (r) => r.id !== null && r.id !== undefined && r.key !== 'end_user',
      );

    // Fetch permissions directly using raw query to exclude audit fields
    const permissionsRaw = await this.userPerms
      .createQueryBuilder('userPermissions')
      .leftJoin('userPermissions.permission', 'permission')
      .where('userPermissions.userId = :id', { id })
      .select([
        'permission.id',
        'permission.key',
        'permission.subject',
        'permission.action',
        'permission.conditions',
        'permission.category',
        'permission.description',
      ])
      .getRawMany();

    // Map raw results to permission objects (excluding audit fields)
    const mappedPermissions = permissionsRaw
      .map((row) => ({
        id: row.permission_id,
        key: row.permission_key,
        subject: row.permission_subject,
        action: row.permission_action,
        conditions: row.permission_conditions,
        category: row.permission_category,
        description: row.permission_description,
      }))
      .filter((p) => p.id !== null && p.id !== undefined);

    // Get end_user role permissions to exclude them
    // Exclude any permissions that belong to the end_user role,
    // regardless of how they were assigned to the user
    const endUserRole = await this.roles.findOne({
      where: { key: 'end_user' },
    });

    if (endUserRole) {
      const endUserRolePermissions = await this.rolePerms.find({
        where: { roleId: endUserRole.id },
        select: ['permissionId'],
      });
      const endUserPermissionIds = new Set(
        endUserRolePermissions.map((rp) => rp.permissionId),
      );

      // Filter out permissions that belong to end_user role
      // This ensures permissions inherited from end_user are never shown
      (user as any).userPermissions = mappedPermissions.filter(
        (p) => !endUserPermissionIds.has(p.id),
      );
    } else {
      (user as any).userPermissions = mappedPermissions;
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
  async updateUser(id: string, put: UpdateUserDto): Promise<User> {
    // Validate user exists and get user entity
    const user = await this.users.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Handle password update
    if (put.password) {
      user.passwordHash = await bcrypt.hash(put.password, 10);
      delete put.password; // Remove plain password from DTO
    }

    // Apply updates to entity
    Object.assign(user, put);

    // Save entity (triggers audit subscriber)
    await this.users.save(user);

    return this.getUser(id);
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
