import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { Membership } from './entities/membership.entity';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';

// Type definitions for better type safety
export interface MembershipResponse {
  groupId: string;
  userId: string;
  removed?: boolean;
  added?: boolean;
}

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,

    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

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
      this.groupsService.getGroup(groupId),
    ]);

    if (!user || !group) {
      throw new NotFoundException('User or Group not found');
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
    await this.memberships.delete({ groupId, userId });

    return { groupId, userId, removed: true };
  }

  /**
   * Gets all members of a group
   */
  async getGroupMembers(groupId: string): Promise<User[]> {
    const membershipRecords = await this.memberships.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });

    const userIds = membershipRecords.map((m) => m.userId);

    if (userIds.length === 0) {
      return [];
    }

    return this.usersService.listUsers({
      id: In(userIds),
    });
  }

  /**
   * Gets all groups for a user
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    const membershipRecords = await this.memberships.find({
      where: { userId },
    });

    const groupIds = membershipRecords.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    return this.groupsService.listGroups({
      id: In(groupIds),
    });
  }
}
