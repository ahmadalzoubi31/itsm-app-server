import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { AssignRolesToUserDto } from './dto/assign-roles-to-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // -------- Roles CRUD --------
  async listRoles(): Promise<Role[]> {
    return this.roles.find({
      where: { key: Not('end_user') },
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }
  async getRoleById(id: string): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const role = this.roles.create(dto);
    role.key = role.key.trim().toLowerCase();
    return await this.roles.save(role);
  }
  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id);
    Object.assign(role, dto);
    return await this.roles.save(role);
  }
  async deleteRole(id: string): Promise<{ ok: boolean }> {
    await this.roles.delete(id);
    return { ok: true };
  }

  // -------- User ↔ Role --------
  async assignRolesToUser(userId: string, dto: AssignRolesToUserDto) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }
    const roles = await this.roles.find({
      where: { id: In(dto.roleIds) },
    });
    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException(`Some roles not found`);
    }
    const existingRoleIds = new Set(user.roles.map((r) => r.id));
    const newRoles = roles.filter((r) => !existingRoleIds.has(r.id));
    user.roles.push(...newRoles);
    await this.users.save(user, { reload: true });
    return { ok: true };
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }
    user.roles = user.roles.filter((r) => r.id !== roleId);
    await this.users.save(user, { reload: true });
    return { ok: true };
  }
}
