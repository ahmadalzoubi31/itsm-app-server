import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupRole } from './entities/group-role.entity';

// Type definitions for better type safety
interface GroupWithAudit extends CreateGroupDto {
  createdById?: string;
  createdByName?: string;
}

interface GroupUpdateWithAudit extends Partial<Group> {
  updatedById?: string;
  updatedByName?: string;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(GroupRole)
    private readonly groupRoles: Repository<GroupRole>,
  ) {}

  /**
   * Creates a new group with proper validation
   */
  async createGroup(input: GroupWithAudit): Promise<Group> {
    const group = this.groups.create({
      ...input,
      createdById: input.createdById,
      createdByName: input.createdByName,
    });

    const savedGroup = await this.groups.save(group);

    return savedGroup;
  }

  /**
   * Lists all groups with optional filtering
   */
  async listGroups(options?: FindOptionsWhere<Group>): Promise<Group[]> {
    return this.groups.find({
      where: options,
      order: { name: 'ASC' },
    });
  }

  /**
   * Gets a group by ID with proper error handling
   */
  async getGroup(id: string): Promise<Group> {
    const group = await this.groups.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  /**
   * Updates a group with validation
   */
  async updateGroup(id: string, patch: GroupUpdateWithAudit): Promise<Group> {
    // Validate group exists
    const before = await this.getGroup(id);

    await this.groups.update({ id }, patch);
    const updated = await this.getGroup(id);

    return updated;
  }

  /**
   * Deletes a group with proper cleanup
   */
  async deleteGroup(id: string): Promise<{ id: string; deleted: boolean }> {
    // Validate group exists and capture data for event
    const group = await this.getGroup(id);

    //Delete group roles
    await this.groupRoles.delete({ groupId: id });

    // Delete group
    await this.groups.delete({ id });

    return { id, deleted: true };
  }

  async getGroupRoles(groupIds: string[]): Promise<GroupRole[]> {
    return this.groupRoles.find({ where: { groupId: In(groupIds) } });
  }
}
