// src/db/seeds/initial-data.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { User } from '@modules/iam/users/entities/user.entity';
import { Permission } from '@modules/iam/permissions/entities/permission.entity';
import { Role } from '@modules/iam/roles/entities/role.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Group } from '@modules/iam/groups/entities/group.entity';
import { SlaTarget } from '@modules/sla/entities/sla-target.entity';
import { ReferenceModule } from '@shared/constants/reference-module.constants';
import { Service } from '@modules/catalog/entities/service.entity';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import {
  Workflow,
  WorkflowTargetType,
} from '@modules/workflow/entities/workflow.entity';

export default class InitialDataSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Starting initial data seeding...');

    // 1. Create system user
    const systemUser = await this.createSystemUser(dataSource);

    // 2. Create case number sequence (idempotent)
    await this.createCaseNumberSequence(dataSource);

    // 3. Create permissions
    const permissions = await this.createPermissions(dataSource);

    // 4. Create roles
    const roles = await this.createRoles(dataSource);

    // 5. Map roles to permissions
    await this.mapRolePermissions(dataSource, roles, permissions);

    // 6. Assign admin role to system user
    await this.assignUserRoles(dataSource, systemUser, roles);

    // 7. Create business lines
    await this.createBusinessLines(dataSource);

    // 8. Create groups for IT business line
    await this.createGroups(dataSource);

    // 9. Create SLA targets for IT business line
    await this.createSlaTargets(dataSource);

    // 10. Create services for IT business line
    await this.createServices(dataSource);

    // 11. Create request number sequence
    await this.createRequestNumberSequence(dataSource);

    // 12. Create workflows for routing requests
    await this.createWorkflows(dataSource);

    // 13. Create service cards for services
    await this.createRequestCards(dataSource);

    console.log('✅ Initial data seeding completed successfully!');
  }

  private async createSystemUser(dataSource: DataSource): Promise<User> {
    console.log('👤 Creating system user...');
    const userRepo = dataSource.getRepository(User);

    let existingUser = await userRepo.findOne({
      where: { username: 'system' },
    });

    if (!existingUser) {
      const systemUser = userRepo.create({
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'system',
        displayName: 'System Administrator',
        email: 'system@itsm.local',
        authSource: 'local',
        passwordHash:
          '$2b$10$hsDw101O1W833/5qKuh2DueavBpTOshwiPgI.zVjrusFFkNm90JxW',
        isActive: true,
        isLicensed: true,
        createdById: '550e8400-e29b-41d4-a716-446655440000',
        createdByName: 'system',
        updatedById: '550e8400-e29b-41d4-a716-446655440000',
        updatedByName: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      existingUser = await userRepo.save(systemUser);
      console.log('  ✓ System user created');
    } else {
      // Update existing system user to ensure it's licensed
      if (!existingUser.isLicensed) {
        existingUser.isLicensed = true;
        await userRepo.save(existingUser);
        console.log('  ✓ System user updated with license');
      } else {
        console.log('  ⊙ System user already exists and is licensed');
      }
    }

    return existingUser;
  }

  private async createCaseNumberSequence(
    dataSource: DataSource,
  ): Promise<void> {
    console.log('🔢 Creating case number sequence...');
    const queryRunner = dataSource.createQueryRunner();

    try {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_class 
          WHERE relkind='S' AND relname='case_number_seq'
        ) as exists
      `);

      if (!result[0].exists) {
        await queryRunner.query(`
          CREATE SEQUENCE case_number_seq 
          START WITH 1 
          INCREMENT BY 1 
          NO MINVALUE 
          NO MAXVALUE 
          CACHE 1
        `);
        console.log('  ✓ Case number sequence created');
      } else {
        // Update existing sequence to use CACHE 1 to minimize gaps
        await queryRunner.query(`
          ALTER SEQUENCE case_number_seq CACHE 1
        `);
        console.log('  ⊙ Case number sequence already exists');
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async createPermissions(
    dataSource: DataSource,
  ): Promise<Record<string, Permission>> {
    console.log('🔐 Creating permissions...');
    const permissionRepo = dataSource.getRepository(Permission);

    const permissionsData = [
      // ==================== Case Permissions ====================
      {
        key: 'case:create',
        subject: 'Case',
        action: 'create',
        category: 'Case Management',
        description: 'Create cases',
      },
      {
        key: 'case:read:any',
        subject: 'Case',
        action: 'read',
        category: 'Case Management',
        description: 'Read any case',
      },
      {
        key: 'case:read:own',
        subject: 'Case',
        action: 'read',
        category: 'Case Management',
        conditions: {
          field: 'requesterId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Read own cases',
      },
      {
        key: 'case:read:assigned',
        subject: 'Case',
        action: 'read',
        category: 'Case Management',
        conditions: {
          field: 'assigneeId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Read assigned cases',
      },
      {
        key: 'case:read:group',
        subject: 'Case',
        action: 'read',
        category: 'Case Management',
        conditions: {
          field: 'assignmentGroupId',
          op: 'in',
          value: '$user.groupIds',
        },
        description: 'Read cases in my groups',
      },
      {
        key: 'case:update:assigned',
        subject: 'Case',
        action: 'update',
        category: 'Case Management',
        conditions: {
          field: 'assigneeId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Update assigned cases',
      },
      {
        key: 'case:update:any',
        subject: 'Case',
        action: 'update',
        category: 'Case Management',
        description: 'Update any case',
      },
      {
        key: 'case:delete',
        subject: 'Case',
        action: 'delete',
        category: 'Case Management',
        description: 'Delete cases',
      },
      // ==================== Request Permissions ====================
      {
        key: 'request:create',
        subject: 'Request',
        action: 'create',
        category: 'Request Management',
        description: 'Create requests',
      },
      {
        key: 'request:read:any',
        subject: 'Request',
        action: 'read',
        category: 'Request Management',
        description: 'Read any request',
      },
      {
        key: 'request:read:own',
        subject: 'Request',
        action: 'read',
        category: 'Request Management',
        conditions: {
          field: 'requesterId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Read own requests',
      },
      {
        key: 'request:read:assigned',
        subject: 'Request',
        action: 'read',
        category: 'Request Management',
        conditions: {
          field: 'assigneeId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Read assigned requests',
      },
      {
        key: 'request:read:group',
        subject: 'Request',
        action: 'read',
        category: 'Request Management',
        conditions: {
          field: 'assignmentGroupId',
          op: 'in',
          value: '$user.groupIds',
        },
        description: 'Read requests in my groups',
      },
      {
        key: 'request:update:assigned',
        subject: 'Request',
        action: 'update',
        category: 'Request Management',
        conditions: {
          field: 'assigneeId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Update assigned requests',
      },
      {
        key: 'request:update:any',
        subject: 'Request',
        action: 'update',
        category: 'Request Management',
        description: 'Update any request',
      },
      // ==================== IAM Permissions ====================
      {
        key: 'user:manage',
        subject: 'User',
        action: 'manage',
        category: 'IAM',
        description: 'Manage users',
      },
      {
        key: 'user:manage-license',
        subject: 'User',
        action: 'manage',
        category: 'IAM',
        description: 'Manage user licenses (assign/revoke licenses)',
      },
      {
        key: 'group:manage',
        subject: 'Group',
        action: 'manage',
        category: 'IAM',
        description: 'Manage support groups',
      },
      {
        key: 'role:manage',
        subject: 'Role',
        action: 'manage',
        category: 'IAM',
        description: 'Manage roles and permissions',
      },
      {
        key: 'permission:manage',
        subject: 'Permission',
        action: 'manage',
        category: 'IAM',
        description: 'Manage permissions',
      },
      // ==================== Foundation Permissions ====================
      {
        key: 'foundation:manage',
        subject: 'Foundation',
        action: 'manage',
        category: 'Foundation',
        description: 'Manage all foundation data (users, groups, categories)',
      },
      {
        key: 'foundation:people',
        subject: 'Foundation',
        action: 'manage',
        category: 'Foundation',
        description: 'Manage foundation people (users)',
      },
      {
        key: 'foundation:support-groups',
        subject: 'Foundation',
        action: 'manage',
        category: 'Foundation',
        description: 'Manage foundation support groups',
      },
      {
        key: 'foundation:category',
        subject: 'Foundation',
        action: 'manage',
        category: 'Foundation',
        description: 'Manage foundation categories',
      },
      {
        key: 'group:manage-members',
        subject: 'Group',
        action: 'manage',
        category: 'Foundation',
        description: 'Manage members in groups where user is a leader',
      },
      {
        key: 'user:manage-group-members',
        subject: 'User',
        action: 'manage',
        category: 'Foundation',
        conditions: {
          field: 'groupId',
          op: 'in',
          value: '$user.leaderGroupIds',
        },
        description:
          'Team leader can manage any member user in their group (update email, details, etc.)',
      },
      // ==================== Catalog Permissions ====================
      {
        key: 'service:read',
        subject: 'Service',
        action: 'read',
        category: 'Service',
        description: 'Browse services',
      },
      {
        key: 'service:submit',
        subject: 'Service',
        action: 'create',
        category: 'Service',
        description: 'Submit requests from service templates',
      },
      {
        key: 'service:manage',
        subject: 'Service',
        action: 'manage',
        category: 'Service',
        description: 'Manage services and templates',
      },
      // ==================== Business Line Permissions ====================
      {
        key: 'business-line:read',
        subject: 'BusinessLine',
        action: 'read',
        category: 'Business Line',
        description: 'Read business lines',
      },
      {
        key: 'business-line:manage',
        subject: 'BusinessLine',
        action: 'manage',
        category: 'Business Line',
        description: 'Manage business lines',
      },
      // ==================== Workflow Permissions ====================
      {
        key: 'workflow:read',
        subject: 'Workflow',
        action: 'read',
        category: 'Workflow',
        description: 'Read workflows',
      },
      {
        key: 'workflow:manage',
        subject: 'Workflow',
        action: 'manage',
        category: 'Workflow',
        description: 'Manage workflows',
      },
      // ==================== SLA Permissions ====================
      {
        key: 'sla:read',
        subject: 'SLA',
        action: 'read',
        category: 'SLA',
        description: 'Read SLA targets and timers',
      },
      {
        key: 'sla:manage',
        subject: 'SLA',
        action: 'manage',
        category: 'SLA',
        description: 'Manage SLA targets',
      },
      // ==================== Email Permissions ====================
      {
        key: 'email:read',
        subject: 'Email',
        action: 'read',
        category: 'Email',
        description: 'Read email messages and channels',
      },
      {
        key: 'email:manage',
        subject: 'Email',
        action: 'manage',
        category: 'Email',
        description: 'Manage email channels, rules, and templates',
      },
      // ==================== Audit Permissions ====================
      {
        key: 'audit:read',
        subject: 'Audit',
        action: 'read',
        category: 'Audit',
        description: 'Read audit logs',
      },
      // ==================== Notification Permissions ====================
      {
        key: 'notify:manage',
        subject: 'Notification',
        action: 'manage',
        category: 'Notification',
        description: 'Manage notification preferences and settings',
      },
      // ==================== Admin Permissions ====================
      {
        key: 'case:manage:any',
        subject: 'all',
        action: 'manage',
        category: 'System',
        description: 'Admin manage all resources',
      },
    ];

    const permissions: Record<string, Permission> = {};

    for (const permData of permissionsData) {
      let permission = await permissionRepo.findOne({
        where: { key: permData.key },
      });

      if (!permission) {
        permission = permissionRepo.create({
          ...permData,
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
        });
        await permissionRepo.save(permission);
        console.log(`  ✓ Created permission: ${permData.key}`);
      } else {
        console.log(`  ⊙ Permission already exists: ${permData.key}`);
      }

      permissions[permData.key] = permission;
    }

    return permissions;
  }

  private async createRoles(
    dataSource: DataSource,
  ): Promise<Record<string, Role>> {
    console.log('👥 Creating roles...');
    const roleRepo = dataSource.getRepository(Role);

    const rolesData = [
      {
        key: 'admin',
        name: 'Administrator',
        description: 'All permissions',
      },
      {
        key: 'agent',
        name: 'Agent',
        description: 'Work cases and requests in assigned groups',
      },
      {
        key: 'end_user',
        name: 'End User',
        description:
          'Self-service catalog user - can request services and view own requests',
      },
    ];

    const roles: Record<string, Role> = {};

    for (const roleData of rolesData) {
      let role = await roleRepo.findOne({
        where: { key: roleData.key },
      });

      if (!role) {
        role = roleRepo.create({
          ...roleData,
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
        });
        await roleRepo.save(role);
        console.log(`  ✓ Created role: ${roleData.key}`);
      } else {
        console.log(`  ⊙ Role already exists: ${roleData.key}`);
      }

      roles[roleData.key] = role;
    }

    return roles;
  }

  private async mapRolePermissions(
    dataSource: DataSource,
    roles: Record<string, Role>,
    permissions: Record<string, Permission>,
  ): Promise<void> {
    console.log('🔗 Mapping roles to permissions...');

    const roleRepo = dataSource.getRepository(Role);

    const mappings = [
      // Admin - Has all permissions via case:manage:any (subject: 'all')
      {
        roleKey: 'admin',
        permissionKeys: ['case:manage:any'],
      },
      // Agent - Anything related to his group or his owned
      {
        roleKey: 'agent',
        permissionKeys: [
          // Cases - assigned or in groups
          'case:read:assigned',
          'case:read:group',
          'case:update:assigned',
          // Requests - assigned or in groups
          'request:read:assigned',
          'request:read:group',
          'request:update:assigned',
        ],
      },
      // End User - Request a service request and view it just
      {
        roleKey: 'end_user',
        permissionKeys: [
          // Create and view own requests
          'request:create',
          'request:read:own',
          // Browse and submit from catalog
          'service:read',
          'service:submit',
          // View business lines (needed for catalog)
          'business-line:read',
        ],
      },
    ];

    for (const mapping of mappings) {
      const role = roles[mapping.roleKey];

      if (!role) {
        console.log(`  ⚠️ Role not found: ${mapping.roleKey}`);
        continue;
      }

      // Reload role with permissions relation to ensure permissions array exists
      const roleWithPermissions = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['permissions'],
      });

      if (!roleWithPermissions) {
        console.log(`  ⚠️ Could not reload role: ${mapping.roleKey}`);
        continue;
      }

      // Initialize permissions array if it doesn't exist
      if (!roleWithPermissions.permissions) {
        roleWithPermissions.permissions = [];
      }

      let permissionCount = 0;

      for (const permKey of mapping.permissionKeys) {
        const permission = permissions[permKey];

        if (permission) {
          // Check if permission is already assigned
          const hasPermission = roleWithPermissions.permissions.some(
            (p) => p.id === permission.id,
          );

          if (!hasPermission) {
            roleWithPermissions.permissions.push(permission);
            await roleRepo.save(roleWithPermissions);
            console.log(`  ✓ Mapped ${mapping.roleKey} → ${permKey}`);
            permissionCount++;
          } else {
            console.log(
              `  ⊙ Mapping already exists: ${mapping.roleKey} → ${permKey}`,
            );
            permissionCount++;
          }
        }
      }

      // Update role with permission count
      await roleRepo.update(roleWithPermissions.id, { permissionCount });
      console.log(
        `  ✓ Updated ${mapping.roleKey} with ${permissionCount} permissions`,
      );
    }
  }

  private async assignUserRoles(
    dataSource: DataSource,
    systemUser: User,
    roles: Record<string, Role>,
  ): Promise<void> {
    console.log('👤 Assigning roles to users...');
    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);

    const adminRole = roles['admin'];

    if (adminRole && systemUser) {
      // Reload user with roles relation to check existing assignments
      const userWithRoles = await userRepo.findOne({
        where: { id: systemUser.id },
        relations: ['roles'],
      });

      if (!userWithRoles) {
        console.log(`  ⚠️ Could not reload system user`);
        return;
      }

      // Initialize roles array if it doesn't exist
      if (!userWithRoles.roles) {
        userWithRoles.roles = [];
      }

      // Check if admin role is already assigned
      const hasAdminRole = userWithRoles.roles.some(
        (r) => r.id === adminRole.id,
      );

      if (!hasAdminRole) {
        userWithRoles.roles.push(adminRole);
        await userRepo.save(userWithRoles);
        console.log(`  ✓ Assigned admin role to system user`);
      } else {
        console.log(`  ⊙ System user already has admin role`);
      }

      // Update userCount for admin role
      const adminUserCount = await userRepo
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role', 'role.id = :roleId', {
          roleId: adminRole.id,
        })
        .getCount();

      await roleRepo.update(adminRole.id, { userCount: adminUserCount });
      console.log(`  ✓ Updated admin role userCount to ${adminUserCount}`);
    }

    // Update user counts for other roles (agent and end_user)
    // Even if they have 0 users, we should set the count
    for (const [roleKey, role] of Object.entries(roles)) {
      if (roleKey !== 'admin') {
        const userCount = await userRepo
          .createQueryBuilder('user')
          .innerJoin('user.roles', 'role', 'role.id = :roleId', {
            roleId: role.id,
          })
          .getCount();

        await roleRepo.update(role.id, { userCount });
        console.log(`  ✓ Updated ${roleKey} role userCount to ${userCount}`);
      }
    }
  }
  private async createBusinessLines(dataSource: DataSource): Promise<void> {
    console.log('🏢 Creating business lines...');
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    const businessLinesData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        key: 'it',
        name: 'Information Technology',
        description: 'IT services, infrastructure, and technical support',
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        key: 'hr',
        name: 'Human Resources',
        description: 'HR services, employee management, and workplace policies',
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        key: 'finance',
        name: 'Finance',
        description: 'Financial services, accounting, and budget management',
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        key: 'facilities',
        name: 'Facilities',
        description: 'Facility management, maintenance, and office services',
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        key: 'legal',
        name: 'Legal',
        description: 'Legal services, compliance, and contract management',
        active: true,
      },
    ];

    for (const blData of businessLinesData) {
      let businessLine = await businessLineRepo.findOne({
        where: { key: blData.key },
      });

      if (!businessLine) {
        businessLine = businessLineRepo.create({
          ...blData,
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
        });
        await businessLineRepo.save(businessLine);
        console.log(`  ✓ Created business line: ${blData.key}`);
      } else {
        console.log(`  ⊙ Business line already exists: ${blData.key}`);
      }
    }
  }

  private async createGroups(dataSource: DataSource): Promise<void> {
    console.log('👥 Creating groups for IT business line...');
    const groupRepo = dataSource.getRepository(Group);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get the IT business line
    const itBusinessLine = await businessLineRepo.findOne({
      where: { key: 'it' },
    });

    if (!itBusinessLine) {
      console.log('  ⚠️ IT business line not found, skipping group creation');
      return;
    }

    const groupsData = [
      {
        type: 'tier-1',
        name: 'IT Tier 1 Support',
        description:
          'First level support - handles initial requests and basic troubleshooting',
        businessLineId: itBusinessLine.id,
      },
      {
        type: 'tier-2',
        name: 'IT Tier 2 Support',
        description:
          'Second level support - handles complex issues and escalations',
        businessLineId: itBusinessLine.id,
      },
      {
        type: 'tier-3',
        name: 'IT Tier 3 Support',
        description: 'Network, servers, and infrastructure management',
        businessLineId: itBusinessLine.id,
      },
      {
        type: 'help-desk',
        name: 'IT Help Desk',
        description: 'Application support and maintenance',
        businessLineId: itBusinessLine.id,
      },
      {
        type: 'tier-1',
        name: 'IT Tier 1 Security',
        description: 'Information security and compliance',
        businessLineId: itBusinessLine.id,
      },
    ];

    for (const groupData of groupsData) {
      let group = await groupRepo.findOne({
        where: {
          type: groupData.type as 'tier-1' | 'tier-2' | 'tier-3' | 'help-desk',
          businessLineId: groupData.businessLineId,
        },
      });

      if (!group) {
        group = groupRepo.create({
          type: groupData.type as 'tier-1' | 'tier-2' | 'tier-3' | 'help-desk',
          name: groupData.name,
          description: groupData.description,
          businessLineId: groupData.businessLineId,
          createdById: '550e8400-e29b-41d4-a716-446655440000',
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
        });
        await groupRepo.save(group);
        console.log(`  ✓ Created group: ${groupData.type}`);
      } else {
        console.log(`  ⊙ Group already exists: ${groupData.type}`);
      }
    }
  }

  private async createSlaTargets(dataSource: DataSource): Promise<void> {
    console.log('⏱️ Creating SLA targets for IT business line...');
    const slaTargetRepo = dataSource.getRepository(SlaTarget);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get the IT business line
    const itBusinessLine = await businessLineRepo.findOne({
      where: { key: 'it' },
    });

    if (!itBusinessLine) {
      console.log(
        '  ⚠️ IT business line not found, skipping SLA target creation',
      );
      return;
    }

    const slaTargetsData = [
      {
        key: 'respond',
        name: 'First Response SLA',
        goalMs: 4 * 60 * 60 * 1000, // 4 hours
        referenceModule: ReferenceModule.CASE,
        businessLineId: itBusinessLine.id,
        rules: {
          startTriggers: [{ event: 'case.created', action: 'start' as const }],
          stopTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                { field: 'to', operator: 'equals' as const, value: 'Resolved' },
              ],
              action: 'stop' as const,
            },
            {
              event: 'case.status.changed',
              conditions: [
                {
                  field: 'to',
                  operator: 'equals' as const,
                  value: 'InProgress',
                },
              ],
              action: 'stop' as const,
            },
          ],
          pauseTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                { field: 'to', operator: 'equals' as const, value: 'OnHold' },
              ],
              action: 'pause' as const,
            },
          ],
          resumeTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                {
                  field: 'to',
                  operator: 'equals' as const,
                  value: 'InProgress',
                },
              ],
              action: 'resume' as const,
            },
          ],
        },
        isActive: true,
      },
      {
        key: 'resolve',
        name: 'Resolution SLA',
        goalMs: 120 * 60 * 60 * 1000, // 120 hours (5 days)
        referenceModule: ReferenceModule.CASE,
        businessLineId: itBusinessLine.id,
        rules: {
          startTriggers: [{ event: 'case.created', action: 'start' as const }],
          stopTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                { field: 'to', operator: 'equals' as const, value: 'Resolved' },
              ],
              action: 'stop' as const,
            },
          ],
          pauseTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                { field: 'to', operator: 'equals' as const, value: 'OnHold' },
              ],
              action: 'pause' as const,
            },
          ],
          resumeTriggers: [
            {
              event: 'case.status.changed',
              conditions: [
                {
                  field: 'to',
                  operator: 'equals' as const,
                  value: 'InProgress',
                },
              ],
              action: 'resume' as const,
            },
          ],
        },
        isActive: true,
      },
    ];

    for (const slaTargetData of slaTargetsData) {
      let slaTarget = await slaTargetRepo.findOne({
        where: {
          key: slaTargetData.key,
          businessLineId: slaTargetData.businessLineId,
        },
      });

      if (!slaTarget) {
        slaTarget = slaTargetRepo.create({
          ...slaTargetData,
          createdById: '550e8400-e29b-41d4-a716-446655440000', // system user
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await slaTargetRepo.save(slaTarget);
        console.log(`  ✓ Created SLA target: ${slaTargetData.key}`);
      } else {
        console.log(`  ⊙ SLA target already exists: ${slaTargetData.key}`);
      }
    }
  }

  private async createServices(dataSource: DataSource): Promise<void> {
    console.log('🛎️ Creating services for IT business line...');
    const serviceRepo = dataSource.getRepository(Service);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get the IT business line
    const itBusinessLine = await businessLineRepo.findOne({
      where: { key: 'it' },
    });

    if (!itBusinessLine) {
      console.log('  ⚠️ IT business line not found, skipping service creation');
      return;
    }

    const servicesData = [
      {
        key: 'it-helpdesk',
        name: 'IT Helpdesk',
        description: 'General IT support and helpdesk services',
        businessLineId: itBusinessLine.id,
      },
      {
        key: 'it-account-management',
        name: 'IT Account Management',
        description:
          'User account creation, modification, and access management',
        businessLineId: itBusinessLine.id,
      },
      {
        key: 'it-software-request',
        name: 'IT Software Request',
        description: 'Request software installation or licenses',
        businessLineId: itBusinessLine.id,
      },
      {
        key: 'it-hardware-request',
        name: 'IT Hardware Request',
        description: 'Request hardware devices like laptops, monitors, etc.',
        businessLineId: itBusinessLine.id,
      },
      {
        key: 'it-network-access',
        name: 'IT Network Access',
        description: 'WiFi access, VPN setup, and network configuration',
        businessLineId: itBusinessLine.id,
      },
      {
        key: 'it-security',
        name: 'IT Security Services',
        description: 'Security incident reporting and access reviews',
        businessLineId: itBusinessLine.id,
      },
    ];

    for (const serviceData of servicesData) {
      let service = await serviceRepo.findOne({
        where: { key: serviceData.key },
      });

      if (!service) {
        service = serviceRepo.create({
          ...serviceData,
          createdById: '550e8400-e29b-41d4-a716-446655440000', // system user
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await serviceRepo.save(service);
        console.log(`  ✓ Created service: ${serviceData.key}`);
      } else {
        console.log(`  ⊙ Service already exists: ${serviceData.key}`);
      }
    }
  }

  private async createRequestNumberSequence(
    dataSource: DataSource,
  ): Promise<void> {
    console.log('🔢 Creating request number sequence...');
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind='S' AND relname='request_number_seq') THEN
          CREATE SEQUENCE request_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
          RAISE NOTICE 'Created sequence request_number_seq';
        ELSE
          ALTER SEQUENCE request_number_seq CACHE 1;
          RAISE NOTICE 'Sequence request_number_seq already exists';
        END IF;
      END$$;
    `);
    console.log('  ✓ Request number sequence ready');
  }

  private async createWorkflows(dataSource: DataSource): Promise<void> {
    console.log('🔄 Creating workflows for request routing...');
    const workflowRepo = dataSource.getRepository(Workflow);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get IT business line
    const itBusinessLine = await businessLineRepo.findOne({
      where: { key: 'it' },
    });

    if (!itBusinessLine) {
      console.log(
        '  ⚠️ IT business line not found, skipping workflow creation',
      );
      return;
    }

    const workflowsData = [
      {
        key: 'critical-incident-workflow',
        name: 'Critical Incident Workflow',
        description: 'Routes critical priority requests to Incident Management',
        targetType: WorkflowTargetType.INCIDENT,
        businessLineId: itBusinessLine.id,
        active: true,
        evaluationOrder: 10,
        conditions: [
          {
            field: 'priority',
            operator: 'equals' as const,
            value: 'Critical',
          },
        ],
      },
      {
        key: 'high-priority-incident-workflow',
        name: 'High Priority Incident Workflow',
        description: 'Routes high priority requests to Incident Management',
        targetType: WorkflowTargetType.INCIDENT,
        businessLineId: itBusinessLine.id,
        active: true,
        evaluationOrder: 20,
        conditions: [
          {
            field: 'priority',
            operator: 'equals' as const,
            value: 'High',
          },
        ],
      },
      {
        key: 'general-support-workflow',
        name: 'General Support Workflow',
        description: 'Routes general requests to Case Management',
        targetType: WorkflowTargetType.CASE,
        businessLineId: itBusinessLine.id,
        active: true,
        evaluationOrder: 100,
      },
    ];

    for (const workflowData of workflowsData) {
      let workflow = await workflowRepo.findOne({
        where: { key: workflowData.key },
      });

      if (!workflow) {
        workflow = workflowRepo.create({
          ...workflowData,
          createdById: '550e8400-e29b-41d4-a716-446655440000', // system user
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await workflowRepo.save(workflow);
        console.log(`  ✓ Created workflow: ${workflowData.name}`);
      } else {
        console.log(`  ⊙ Workflow already exists: ${workflowData.name}`);
      }
    }
  }

  private async createRequestCards(dataSource: DataSource): Promise<void> {
    console.log('📋 Creating request cards for services...');
    const requestCardRepo = dataSource.getRepository(RequestCard);
    const serviceRepo = dataSource.getRepository(Service);
    const groupRepo = dataSource.getRepository(Group);
    const businessLineRepo = dataSource.getRepository(BusinessLine);

    // Get IT business line
    const itBusinessLine = await businessLineRepo.findOne({
      where: { key: 'it' },
    });

    if (!itBusinessLine) {
      console.log(
        '  ⚠️ IT business line not found, skipping template creation',
      );
      return;
    }

    // Get default assignment group (IT Tier 1 Support)
    const defaultGroup = await groupRepo.findOne({
      where: {
        type: 'tier-1',
        businessLineId: itBusinessLine.id,
      },
    });

    if (!defaultGroup) {
      console.log(
        '  ⚠️ Default assignment group not found, skipping template creation',
      );
      return;
    }

    // Define templates for each service
    const templatesData = [
      // IT Helpdesk Templates
      {
        serviceKey: 'it-helpdesk',
        key: 'password-reset',
        name: 'Password Reset Request',
        jsonSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              title: 'Username',
              description: 'Your username or email address',
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: 'How urgent is this request?',
            },
            additionalInfo: {
              type: 'string',
              title: 'Additional Information',
              description: 'Any additional details about your request',
              maxLength: 500,
            },
          },
          required: ['username', 'urgency'],
        },
        defaults: {
          urgency: 'Medium',
        },
        active: true,
      },
      {
        serviceKey: 'it-helpdesk',
        key: 'technical-support',
        name: 'General Technical Support',
        jsonSchema: {
          type: 'object',
          properties: {
            issueType: {
              type: 'string',
              title: 'Issue Type',
              enum: [
                'Email Issues',
                'Application Not Working',
                'Printer Problems',
                'Slow Performance',
                'Other',
              ],
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
            description: {
              type: 'string',
              title: 'Problem Description',
              description: 'Describe the issue you are experiencing',
              maxLength: 1000,
            },
            affectedUsers: {
              type: 'string',
              title: 'Affected Users',
              description:
                'How many users are affected? (e.g., "Just me", "5 users", "Entire department")',
            },
          },
          required: ['issueType', 'urgency', 'description'],
        },
        defaults: {
          urgency: 'Medium',
        },
        active: true,
      },
      // IT Account Management Templates
      {
        serviceKey: 'it-account-management',
        key: 'new-user-account',
        name: 'New User Account Request',
        jsonSchema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              title: 'First Name',
            },
            lastName: {
              type: 'string',
              title: 'Last Name',
            },
            email: {
              type: 'string',
              title: 'Email Address',
              format: 'email',
            },
            department: {
              type: 'string',
              title: 'Department',
            },
            jobTitle: {
              type: 'string',
              title: 'Job Title',
            },
            startDate: {
              type: 'string',
              title: 'Start Date',
              format: 'date',
            },
            manager: {
              type: 'string',
              title: 'Manager Name',
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'firstName',
            'lastName',
            'email',
            'department',
            'startDate',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
        },
        active: true,
      },
      {
        serviceKey: 'it-account-management',
        key: 'access-request',
        name: 'System Access Request',
        jsonSchema: {
          type: 'object',
          properties: {
            systemName: {
              type: 'string',
              title: 'System/Application Name',
              description: 'Which system do you need access to?',
            },
            accessLevel: {
              type: 'string',
              title: 'Access Level',
              enum: [
                'Read Only',
                'Standard User',
                'Power User',
                'Administrator',
              ],
            },
            businessJustification: {
              type: 'string',
              title: 'Business Justification',
              description: 'Why do you need this access?',
              maxLength: 500,
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'systemName',
            'accessLevel',
            'businessJustification',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
          accessLevel: 'Standard User',
        },
        active: true,
      },
      // IT Software Request Templates
      {
        serviceKey: 'it-software-request',
        key: 'software-installation',
        name: 'Software Installation Request',
        jsonSchema: {
          type: 'object',
          properties: {
            softwareName: {
              type: 'string',
              title: 'Software Name',
              description: 'Name of the software you need',
            },
            version: {
              type: 'string',
              title: 'Version (if specific)',
            },
            businessJustification: {
              type: 'string',
              title: 'Business Justification',
              description: 'Why do you need this software?',
              maxLength: 500,
            },
            licenseRequired: {
              type: 'string',
              title: 'License Required?',
              enum: ['Yes', 'No', 'Not Sure'],
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: ['softwareName', 'businessJustification', 'urgency'],
        },
        defaults: {
          urgency: 'Medium',
          licenseRequired: 'Not Sure',
        },
        active: true,
      },
      // IT Hardware Request Templates
      {
        serviceKey: 'it-hardware-request',
        key: 'new-laptop',
        name: 'New Laptop Request',
        jsonSchema: {
          type: 'object',
          properties: {
            laptopType: {
              type: 'string',
              title: 'Laptop Type',
              enum: [
                'Standard Business Laptop',
                'High Performance Laptop',
                'Developer Workstation',
              ],
            },
            operatingSystem: {
              type: 'string',
              title: 'Operating System',
              enum: ['Windows 11', 'macOS', 'Linux'],
            },
            businessJustification: {
              type: 'string',
              title: 'Business Justification',
              description: 'Why do you need a new laptop?',
              maxLength: 500,
            },
            requiredByDate: {
              type: 'string',
              title: 'Required By Date',
              format: 'date',
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'laptopType',
            'operatingSystem',
            'businessJustification',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
          operatingSystem: 'Windows 11',
          laptopType: 'Standard Business Laptop',
        },
        active: true,
      },
      {
        serviceKey: 'it-hardware-request',
        key: 'peripheral-equipment',
        name: 'Peripheral Equipment Request',
        jsonSchema: {
          type: 'object',
          properties: {
            equipmentType: {
              type: 'string',
              title: 'Equipment Type',
              enum: [
                'Monitor',
                'Keyboard',
                'Mouse',
                'Headset',
                'Webcam',
                'Docking Station',
                'Other',
              ],
            },
            quantity: {
              type: 'number',
              title: 'Quantity',
              minimum: 1,
              maximum: 10,
            },
            businessJustification: {
              type: 'string',
              title: 'Business Justification',
              maxLength: 500,
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'equipmentType',
            'quantity',
            'businessJustification',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
          quantity: 1,
        },
        active: true,
      },
      // IT Network Access Templates
      {
        serviceKey: 'it-network-access',
        key: 'vpn-access',
        name: 'VPN Access Request',
        jsonSchema: {
          type: 'object',
          properties: {
            deviceType: {
              type: 'string',
              title: 'Device Type',
              enum: ['Company Laptop', 'Personal Computer', 'Mobile Device'],
            },
            businessJustification: {
              type: 'string',
              title: 'Business Justification',
              description: 'Why do you need VPN access?',
              maxLength: 500,
            },
            duration: {
              type: 'string',
              title: 'Access Duration',
              enum: ['Temporary (< 1 month)', 'Ongoing', 'Project-based'],
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'deviceType',
            'businessJustification',
            'duration',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
          duration: 'Ongoing',
        },
        active: true,
      },
      {
        serviceKey: 'it-network-access',
        key: 'wifi-access',
        name: 'Guest WiFi Access Request',
        jsonSchema: {
          type: 'object',
          properties: {
            guestName: {
              type: 'string',
              title: 'Guest Name',
            },
            guestEmail: {
              type: 'string',
              title: 'Guest Email',
              format: 'email',
            },
            accessDate: {
              type: 'string',
              title: 'Access Date',
              format: 'date',
            },
            duration: {
              type: 'string',
              title: 'Duration',
              enum: ['1 Day', '1 Week', '2 Weeks', '1 Month'],
            },
            urgency: {
              type: 'string',
              title: 'Urgency',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
          },
          required: [
            'guestName',
            'guestEmail',
            'accessDate',
            'duration',
            'urgency',
          ],
        },
        defaults: {
          urgency: 'Medium',
          duration: '1 Day',
        },
        active: true,
      },
      // IT Security Templates
      {
        serviceKey: 'it-security',
        key: 'security-incident',
        name: 'Security Incident Report',
        jsonSchema: {
          type: 'object',
          properties: {
            incidentType: {
              type: 'string',
              title: 'Incident Type',
              enum: [
                'Suspicious Email',
                'Malware/Virus',
                'Data Breach',
                'Lost/Stolen Device',
                'Unauthorized Access',
                'Other',
              ],
            },
            severity: {
              type: 'string',
              title: 'Severity',
              enum: ['Low', 'Medium', 'High', 'Critical'],
            },
            description: {
              type: 'string',
              title: 'Incident Description',
              description: 'Describe what happened in detail',
              maxLength: 1000,
            },
            whenDiscovered: {
              type: 'string',
              title: 'When was this discovered?',
            },
            affectedSystems: {
              type: 'string',
              title: 'Affected Systems',
              description: 'Which systems or data are affected?',
            },
          },
          required: [
            'incidentType',
            'severity',
            'description',
            'whenDiscovered',
          ],
        },
        defaults: {
          severity: 'High',
        },
        active: true,
      },
    ];

    for (const templateData of templatesData) {
      // Find the service
      const service = await serviceRepo.findOne({
        where: { key: templateData.serviceKey },
      });

      if (!service) {
        console.log(
          `  ⚠️ Service not found: ${templateData.serviceKey}, skipping request card`,
        );
        continue;
      }

      // Check if request card already exists
      let requestCard = await requestCardRepo.findOne({
        where: { key: templateData.key },
      });

      if (!requestCard) {
        requestCard = requestCardRepo.create({
          serviceId: service.id,
          key: templateData.key,
          name: templateData.name,
          jsonSchema: templateData.jsonSchema,
          defaults: templateData.defaults,
          defaultAssignmentGroupId: defaultGroup.id,
          businessLineId: itBusinessLine.id,
          active: templateData.active,
          createdById: '550e8400-e29b-41d4-a716-446655440000', // system user
          createdByName: 'system',
          updatedById: '550e8400-e29b-41d4-a716-446655440000',
          updatedByName: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await requestCardRepo.save(requestCard);
        console.log(`  ✓ Created request card: ${templateData.name}`);
      } else {
        console.log(`  ⊙ Request card already exists: ${templateData.name}`);
      }
    }

    console.log(`  ✅ Request cards creation completed`);
  }
}
