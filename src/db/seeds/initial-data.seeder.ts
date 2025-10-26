// src/db/seeds/initial-data.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { User } from '@modules/iam/users/entities/user.entity';
import { Permission } from '@modules/iam/permissions/entities/permission.entity';
import { Role } from '@modules/iam/permissions/entities/role.entity';
import { RolePermission } from '@modules/iam/permissions/entities/role-permission.entity';
import { UserRole } from '@modules/iam/users/entities/user-role.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';

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
        createdById: '550e8400-e29b-41d4-a716-446655440000',
        createdByName: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      existingUser = await userRepo.save(systemUser);
      console.log('  ✓ System user created');
    } else {
      console.log('  ⊙ System user already exists');
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
          CACHE 20
        `);
        console.log('  ✓ Case number sequence created');
      } else {
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
      {
        key: 'case:create',
        subject: 'Case',
        action: 'create',
        description: 'Create cases',
      },
      {
        key: 'case:read:any',
        subject: 'Case',
        action: 'read',
        description: 'Read any case',
      },
      {
        key: 'case:read:own',
        subject: 'Case',
        action: 'read',
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
        conditions: {
          field: 'assigneeId',
          op: 'eq',
          value: '$user.id',
        },
        description: 'Update assigned cases',
      },
      {
        key: 'case:manage:any',
        subject: 'all',
        action: 'manage',
        description: 'Admin manage all',
      },
      {
        key: 'group:manage',
        subject: 'Group',
        action: 'manage',
        description: 'Manage support groups',
      },
      {
        key: 'user:manage',
        subject: 'User',
        action: 'manage',
        description: 'Manage users',
      },
    ];

    const permissions: Record<string, Permission> = {};

    for (const permData of permissionsData) {
      let permission = await permissionRepo.findOne({
        where: { key: permData.key },
      });

      if (!permission) {
        permission = permissionRepo.create(permData);
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
        description: 'Work cases',
      },
      {
        key: 'requester',
        name: 'Requester',
        description: 'Submitter',
      },
      {
        key: 'end_user',
        name: 'End User',
        description:
          'Self-service catalog user - can view services and own requests',
      },
    ];

    const roles: Record<string, Role> = {};

    for (const roleData of rolesData) {
      let role = await roleRepo.findOne({
        where: { key: roleData.key },
      });

      if (!role) {
        role = roleRepo.create(roleData);
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
    const rolePermissionRepo = dataSource.getRepository(RolePermission);

    const mappings = [
      // Admin
      {
        roleKey: 'admin',
        permissionKeys: [
          'case:manage:any',
          'case:read:any',
          'group:manage',
          'user:manage',
        ],
      },
      // Agent
      {
        roleKey: 'agent',
        permissionKeys: [
          'case:read:assigned',
          'case:read:group',
          'case:update:assigned',
        ],
      },
      // Requester
      {
        roleKey: 'requester',
        permissionKeys: ['case:create', 'case:read:own'],
      },
      // End User (default role for self-service catalog)
      {
        roleKey: 'end_user',
        permissionKeys: ['case:create', 'case:read:own'],
      },
    ];

    for (const mapping of mappings) {
      const role = roles[mapping.roleKey];

      for (const permKey of mapping.permissionKeys) {
        const permission = permissions[permKey];

        if (role && permission) {
          const existing = await rolePermissionRepo.findOne({
            where: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });

          if (!existing) {
            const rolePermission = rolePermissionRepo.create({
              roleId: role.id,
              permissionId: permission.id,
            });
            await rolePermissionRepo.save(rolePermission);
            console.log(`  ✓ Mapped ${mapping.roleKey} → ${permKey}`);
          } else {
            console.log(
              `  ⊙ Mapping already exists: ${mapping.roleKey} → ${permKey}`,
            );
          }
        }
      }
    }
  }

  private async assignUserRoles(
    dataSource: DataSource,
    systemUser: User,
    roles: Record<string, Role>,
  ): Promise<void> {
    console.log('👤 Assigning roles to users...');
    const userRoleRepo = dataSource.getRepository(UserRole);

    const adminRole = roles['admin'];

    if (adminRole && systemUser) {
      const existing = await userRoleRepo.findOne({
        where: {
          userId: systemUser.id,
          roleId: adminRole.id,
        },
      });

      if (!existing) {
        const userRole = userRoleRepo.create({
          userId: systemUser.id,
          roleId: adminRole.id,
        });
        await userRoleRepo.save(userRole);
        console.log(`  ✓ Assigned admin role to system user`);
      } else {
        console.log(`  ⊙ System user already has admin role`);
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
        businessLine = businessLineRepo.create(blData);
        await businessLineRepo.save(businessLine);
        console.log(`  ✓ Created business line: ${blData.key}`);
      } else {
        console.log(`  ⊙ Business line already exists: ${blData.key}`);
      }
    }
  }
}
