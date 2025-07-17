import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupFiltersDto } from './dto/group-filters.dto';
import { Group } from './entities/group.entity';
import {
  GroupMember,
  GroupMemberRoleEnum,
} from './entities/group-member.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { AddMembersBatchDto } from './dto/add-members-batch.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    console.log(
      '🚀 ~ GroupsService ~ create ~ createGroupDto:',
      createGroupDto,
    );
    const group = this.groupRepository.create(createGroupDto);

    const savedGroup = await this.groupRepository.save(group);

    // Add members if provided
    if (createGroupDto.memberIds && createGroupDto.memberIds.length > 0) {
      await this.addMembersToGroup(savedGroup.id, createGroupDto.memberIds);
    }

    return this.findOne(savedGroup.id);
  }

  async findAll(filters?: GroupFiltersDto): Promise<Group[]> {
    const query = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.leader', 'leader')
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .leftJoinAndSelect('group.updatedBy', 'updatedBy');

    if (filters?.search) {
      query.andWhere(
        'group.name ILIKE :search OR group.description ILIKE :search',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.type) {
      query.andWhere('group.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('group.status = :status', { status: filters.status });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('group.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.leaderId) {
      query.andWhere('group.leaderId = :leaderId', {
        leaderId: filters.leaderId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: [
        'leader',
        'members',
        'members.user',
        'createdBy',
        'updatedBy',
      ],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    Object.assign(group, updateGroupDto);

    await this.groupRepository.save(group);

    // Update members if provided
    if (updateGroupDto.memberIds) {
      await this.updateGroupMembers(id, updateGroupDto.memberIds);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }

  // Group Members methods
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const members = await this.groupMemberRepository.find({
      where: { groupId, isActive: true },
      relations: ['user'],
    });
    return members;
  }

  async addMember(
    groupId: string,
    addMemberDto: AddMemberDto,
  ): Promise<GroupMember> {
    // Check if group exists
    await this.findOne(groupId);

    // Check if member already exists
    const existingMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      throw new Error('Member already exists in this group');
    }

    const groupMember = this.groupMemberRepository.create({
      groupId,
      userId: addMemberDto.userId,
      role: addMemberDto.role || GroupMemberRoleEnum.MEMBER,
    });

    const savedMember = await this.groupMemberRepository.save(groupMember);

    // Return with user relation
    const memberWithUser = await this.groupMemberRepository.findOne({
      where: { id: savedMember.id },
      relations: ['user'],
    });

    if (!memberWithUser) {
      throw new Error('Failed to create group member');
    }

    return memberWithUser;
  }

  async addMembersBatch(
    groupId: string,
    addMembersBatchDto: AddMembersBatchDto,
  ): Promise<GroupMember[]> {
    // Check if group exists
    await this.findOne(groupId);

    const members: GroupMember[] = [];

    for (const userId of addMembersBatchDto.userIds) {
      // Check if member already exists
      const existingMember = await this.groupMemberRepository.findOne({
        where: { groupId, userId },
      });

      if (!existingMember) {
        const groupMember = this.groupMemberRepository.create({
          groupId,
          userId,
          role: addMembersBatchDto.role || GroupMemberRoleEnum.MEMBER,
        });
        members.push(groupMember);
      }
    }

    const savedMembers = await this.groupMemberRepository.save(members);

    // Return with user relations
    const memberIds = savedMembers.map((m) => m.id);
    return this.groupMemberRepository.find({
      where: { id: In(memberIds) },
      relations: ['user'],
    });
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<GroupMember> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!member) {
      throw new Error('Member not found in this group');
    }

    member.role = updateMemberRoleDto.role;
    const updatedMember = await this.groupMemberRepository.save(member);

    // Return with user relation
    const memberWithUser = await this.groupMemberRepository.findOne({
      where: { id: updatedMember.id },
      relations: ['user'],
    });

    if (!memberWithUser) {
      throw new Error('Failed to update group member');
    }

    return memberWithUser;
  }

  async removeMember(
    groupId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!member) {
      throw new Error('Member not found in this group');
    }

    await this.groupMemberRepository.remove(member);
    return { success: true };
  }

  private async addMembersToGroup(
    groupId: string,
    memberIds: string[],
  ): Promise<void> {
    for (const userId of memberIds) {
      const groupMember = this.groupMemberRepository.create({
        groupId,
        userId,
        role: 'MEMBER' as any,
      });
      await this.groupMemberRepository.save(groupMember);
    }
  }

  private async updateGroupMembers(
    groupId: string,
    memberIds: string[],
  ): Promise<void> {
    // Remove existing members
    await this.groupMemberRepository.delete({ groupId });

    // Add new members
    await this.addMembersToGroup(groupId, memberIds);
  }
}
