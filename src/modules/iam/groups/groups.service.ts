import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { Membership } from './entities/membership.entity';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

// Type definitions for membership operations
export interface MembershipResponse {
  groupId: string;
  userId: string;
  removed?: boolean;
  added?: boolean;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates a new group with proper validation
   */
  async createGroup(input: CreateGroupDto): Promise<Group> {
    const group = this.groups.create(input);

    const savedGroup = await this.groups.save(group);

    return savedGroup;
  }

  /**
   * Lists all groups with optional filtering
   */
  async listGroups(options?: FindOptionsWhere<Group>): Promise<Group[]> {
    return this.groups.find({
      where: options,
      relations: ['businessLine', 'memberships'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Gets a group by ID with proper error handling
   */
  async getGroup(id: string): Promise<Group> {
    const group = await this.groups.findOne({
      where: { id },
      relations: ['businessLine'],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  /**
   * Updates a group with validation
   */
  async updateGroup(id: string, dto: UpdateGroupDto): Promise<Group> {
    // Validate group exists and get entity
    const group = await this.getGroup(id);

    // Apply updates to entity
    Object.assign(group, dto);

    // Save entity (triggers audit subscriber)
    return this.groups.save(group);
  }

  /**
   * Deletes a group with proper cleanup
   */
  async deleteGroup(id: string): Promise<{ id: string; deleted: boolean }> {
    // Validate group exists and capture data for event
    const group = await this.getGroup(id);

    // Delete group
    await this.groups.delete({ id });

    return { id, deleted: true };
  }

  /**
   * Adds a user to a group with proper validation
   */
  async addMember(
    groupId: string,
    userId: string,
  ): Promise<MembershipResponse> {
    // Validate user and group exist
    const [user, group] = await Promise.all([
      this.usersService.getUser(userId),
      this.getGroup(groupId),
    ]);

    if (!user || !group) {
      throw new NotFoundException('User or Group not found');
    }

    // Check if membership already exists
    const existing = await this.memberships.findOne({
      where: { groupId, userId },
    });

    if (existing) {
      return { groupId, userId, added: false };
    }

    const membership = this.memberships.create({ groupId, userId });
    await this.memberships.save(membership);

    return { groupId, userId, added: true };
  }

  /**
   * Removes a user from a group with proper validation
   */
  async removeMember(
    groupId: string,
    userId: string,
  ): Promise<MembershipResponse> {
    // Validate user and group exist
    const [user, group] = await Promise.all([
      this.usersService.getUser(userId),
      this.getGroup(groupId),
    ]);

    if (!user || !group) {
      throw new NotFoundException('User or Group not found');
    }

    const result = await this.memberships.delete({ groupId, userId });

    return {
      groupId,
      userId,
      removed: result.affected ? result.affected > 0 : false,
    };
  }

  /**
   * Gets all members of a group
   */
  async getGroupMembers(groupId: string): Promise<User[]> {
    // Validate group exists before fetching members
    await this.getGroup(groupId);

    const membershipRecords = await this.memberships.find({
      where: { groupId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return membershipRecords.map((m) => m.user);
  }

  /**
   * Adds multiple users to a group
   */
  async addMembers(
    groupId: string,
    userIds: string[],
  ): Promise<MembershipResponse[]> {
    const results: MembershipResponse[] = [];

    for (const userId of userIds) {
      const result = await this.addMember(groupId, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Removes multiple users from a group
   */
  async removeMembers(
    groupId: string,
    userIds: string[],
  ): Promise<MembershipResponse[]> {
    const results: MembershipResponse[] = [];

    for (const userId of userIds) {
      const result = await this.removeMember(groupId, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Adds users to a group (public API)
   */
  async addUsersToGroup(groupId: string, userIds: string[]): Promise<User[]> {
    await this.addMembers(groupId, userIds);
    return this.getGroupMembers(groupId);
  }

  /**
   * Removes users from a group (public API)
   */
  async removeUsersFromGroup(
    groupId: string,
    userIds: string[],
  ): Promise<User[]> {
    await this.removeMembers(groupId, userIds);
    return this.getGroupMembers(groupId);
  }
}
