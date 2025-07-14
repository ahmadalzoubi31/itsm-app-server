import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupFiltersDto } from './dto/group-filters.dto';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    console.log("🚀 ~ GroupsService ~ create ~ createGroupDto:", createGroupDto)
    const group = this.groupRepository.create(createGroupDto);

    const savedGroup = await this.groupRepository.save(group);

    // Add members if provided
    if (createGroupDto.memberIds && createGroupDto.memberIds.length > 0) {
      await this.addMembersToGroup(savedGroup.id, createGroupDto.memberIds);
    }

    return this.findOne(savedGroup.id);
  }

  async findAll(filters?: GroupFiltersDto): Promise<Group[]> {
    const query = this.groupRepository.createQueryBuilder('group')
      .leftJoinAndSelect('group.leader', 'leader')
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .leftJoinAndSelect('group.updatedBy', 'updatedBy');

    if (filters?.search) {
      query.andWhere('group.name ILIKE :search OR group.description ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.type) {
      query.andWhere('group.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('group.status = :status', { status: filters.status });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('group.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.leaderId) {
      query.andWhere('group.leaderId = :leaderId', { leaderId: filters.leaderId });
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

  private async addMembersToGroup(groupId: string, memberIds: string[]): Promise<void> {
    for (const userId of memberIds) {
      const groupMember = this.groupMemberRepository.create({
        groupId,
        userId,
        role: 'MEMBER' as any,
      });
      await this.groupMemberRepository.save(groupMember);
    }
  }

  private async updateGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
    // Remove existing members
    await this.groupMemberRepository.delete({ groupId });
    
    // Add new members
    await this.addMembersToGroup(groupId, memberIds);
  }
}
