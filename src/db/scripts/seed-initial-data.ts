// src/db/scripts/seed-initial-data.ts
/**
 * Standalone script to seed initial data using raw SQL queries
 * This is an alternative to using the TypeORM seeder
 *
 * Usage: pnpm run seed:sql
 */
import 'reflect-metadata';
import dataSource from '../data-source';

async function seedInitialData() {
  try {
    console.log('🚀 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully!\n');

    // 1. System User
    console.log('👤 Creating system user...');
    await dataSource.query(`
      INSERT INTO "user" (
        id, "username", "displayName", "email", "authSource", "passwordHash", "isActive", "createdByName"
      ) VALUES (
        gen_random_uuid(),
        'system',
        'System Administrator',
        'system@itsm.local',
        'local',
        '$2b$10$hsDw101O1W833/5qKuh2DueavBpTOshwiPgI.zVjrusFFkNm90JxW',
        true,
        'system'
      )
      ON CONFLICT (username) DO NOTHING
    `);
    console.log('  ✓ System user created/verified\n');

    // 2. Case Number Sequence
    console.log('🔢 Creating case number sequence...');
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind='S' AND relname='case_number_seq') THEN
          CREATE SEQUENCE case_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 20;
        END IF;
      END$$
    `);
    console.log('  ✓ Case number sequence created/verified\n');

    // 3. Permissions
    console.log('🔐 Creating permissions...');
    await dataSource.query(`
      INSERT INTO public.permission (id,key,subject,action,conditions,description,"createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(),'case:create','Case','create',NULL,'Create cases', now(), now()),
        (gen_random_uuid(),'case:read:any','Case','read',NULL,'Read any case', now(), now()),
        (gen_random_uuid(),'case:read:own','Case','read','{"field":"requesterId","op":"eq","value":"$user.id"}','Read own cases', now(), now()),
        (gen_random_uuid(),'case:read:assigned','Case','read','{"field":"assigneeId","op":"eq","value":"$user.id"}','Read assigned cases', now(), now()),
        (gen_random_uuid(),'case:read:group','Case','read','{"field":"assignmentGroupId","op":"in","value":"$user.groupIds"}','Read cases in my groups', now(), now()),
        (gen_random_uuid(),'case:update:assigned','Case','update','{"field":"assigneeId","op":"eq","value":"$user.id"}','Update assigned cases', now(), now()),
        (gen_random_uuid(),'case:manage:any','all','manage',NULL,'Admin manage all', now(), now()),
        (gen_random_uuid(),'group:manage','Group','manage',NULL,'Manage support groups', now(), now()),
        (gen_random_uuid(),'user:manage','User','manage',NULL,'Manage users', now(), now())
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('  ✓ Permissions created/verified\n');

    // 4. Roles
    console.log('👥 Creating roles...');
    await dataSource.query(`
      INSERT INTO role (id,key,name,description,"createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(),'admin','Administrator','All permissions', now(), now()),
        (gen_random_uuid(),'agent','Agent','Work cases', now(), now()),
        (gen_random_uuid(),'requester','Requester','Submitter', now(), now())
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('  ✓ Roles created/verified\n');

    // 5. Role-Permission Mappings
    console.log('🔗 Mapping roles to permissions...');
    await dataSource.query(`
      WITH
      r AS (SELECT id,key FROM role),
      p AS (SELECT id,key FROM permission)
      INSERT INTO role_permission (id, "roleId", "permissionId", "createdAt", "updatedAt")
      SELECT gen_random_uuid(), r.id, p.id, now(), now()
      FROM r JOIN p ON TRUE
      WHERE (r.key='admin'     AND p.key IN ('case:manage:any','case:read:any','group:manage','user:manage'))
         OR (r.key='agent'     AND p.key IN ('case:read:assigned','case:read:group','case:update:assigned'))
         OR (r.key='requester' AND p.key IN ('case:create','case:read:own'))
      ON CONFLICT ("roleId", "permissionId") DO NOTHING
    `);
    console.log('  ✓ Role-permission mappings created/verified\n');

    // 6. Business Lines
    console.log('🏢 Creating business lines...');
    await dataSource.query(`
      INSERT INTO business_line (id, key, name, description, active, "createdAt", "updatedAt")
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'it', 'Information Technology', 'IT services, infrastructure, and technical support', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', 'hr', 'Human Resources', 'HR services, employee management, and workplace policies', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', 'finance', 'Finance', 'Financial services, accounting, and budget management', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440004', 'facilities', 'Facilities', 'Facility management, maintenance, and office services', true, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440005', 'legal', 'Legal', 'Legal services, compliance, and contract management', true, NOW(), NOW())
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('  ✓ Business lines created/verified\n');

    console.log('🎉 All initial data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

seedInitialData();
