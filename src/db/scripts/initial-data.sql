-- Initial Data Setup for ITSM Application
-- This file contains the original SQL queries for reference
-- You can run this directly in your PostgreSQL client or use the TypeScript seeders instead

-- ====================
-- 1. SYSTEM USER
-- ====================
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
ON CONFLICT (username) DO NOTHING;

-- ====================
-- 2. CASE NUMBER SEQUENCE
-- ====================
-- Idempotent sequence creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind='S' AND relname='case_number_seq') THEN
    CREATE SEQUENCE case_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
  ELSE
    ALTER SEQUENCE case_number_seq CACHE 1;
  END IF;
END$$;

-- ====================
-- 2.1. REQUEST NUMBER SEQUENCE
-- ====================
-- Idempotent sequence creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind='S' AND relname='request_number_seq') THEN
    CREATE SEQUENCE request_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
  ELSE
    ALTER SEQUENCE request_number_seq CACHE 1;
  END IF;
END$$;

-- ====================
-- 3. PERMISSIONS
-- ====================
INSERT INTO public.permission (id,key,subject,action,conditions,description,"createdAt", "updatedAt")
VALUES
  (gen_random_uuid(),'case:create','Case','create',NULL,'Create cases', now(), now()),
  (gen_random_uuid(),'case:read:any','Case','read',NULL,'Read any case', now(), now()),
  (gen_random_uuid(),'case:read:own','Case','read','{"field":"requesterId","op":"eq","value":"$user.id"}','Read own cases', now(), now()),
  (gen_random_uuid(),'case:read:assigned','Case','read','{"field":"assigneeId","op":"eq","value":"$user.id"}','Read assigned cases', now(), now()),
  (gen_random_uuid(),'case:read:group','Case','read','{"field":"assignmentGroupId","op":"in","value":"$user.groupIds"}','Read cases in my groups', now(), now()),
  (gen_random_uuid(),'case:update:assigned','Case','update','{"field":"assigneeId","op":"eq","value":"$user.id"}','Update assigned cases', now(), now()),
  (gen_random_uuid(),'request:create','Request','create',NULL,'Create requests', now(), now()),
  (gen_random_uuid(),'request:read:any','Request','read',NULL,'Read any request', now(), now()),
  (gen_random_uuid(),'request:read:own','Request','read','{"field":"requesterId","op":"eq","value":"$user.id"}','Read own requests', now(), now()),
  (gen_random_uuid(),'request:read:assigned','Request','read','{"field":"assigneeId","op":"eq","value":"$user.id"}','Read assigned requests', now(), now()),
  (gen_random_uuid(),'request:update:assigned','Request','update','{"field":"assigneeId","op":"eq","value":"$user.id"}','Update assigned requests', now(), now()),
  (gen_random_uuid(),'case:manage:any','all','manage',NULL,'Admin manage all', now(), now()),
  (gen_random_uuid(),'group:manage','Group','manage',NULL,'Manage support groups', now(), now()),
  (gen_random_uuid(),'user:manage','User','manage',NULL,'Manage users', now(), now())
ON CONFLICT (key) DO NOTHING;

-- ====================
-- 4. ROLES
-- ====================
INSERT INTO role (id,key,name,description,"createdAt", "updatedAt")
VALUES
  (gen_random_uuid(),'admin','Administrator','All permissions', now(), now()),
  (gen_random_uuid(),'agent','Agent','Work cases', now(), now())
ON CONFLICT (key) DO NOTHING;

-- ====================
-- 5. ROLE-PERMISSION MAPPINGS
-- ====================
WITH
r AS (SELECT id,key FROM role),
p AS (SELECT id,key FROM permission)
INSERT INTO role_permission (id, "roleId", "permissionId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), r.id, p.id, now(), now()
FROM r JOIN p ON TRUE
WHERE (r.key='admin'     AND p.key IN ('case:manage:any','case:read:any','request:read:any','request:update:assigned','group:manage','user:manage'))
   OR (r.key='agent'     AND p.key IN ('case:read:assigned','case:read:group','case:update:assigned','request:read:assigned','request:update:assigned'))
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ====================
-- 6. BUSINESS LINES
-- ====================
INSERT INTO business_line (id, key, name, description, active, "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'it', 'Information Technology', 'IT services, infrastructure, and technical support', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'hr', 'Human Resources', 'HR services, employee management, and workplace policies', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'finance', 'Finance', 'Financial services, accounting, and budget management', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'facilities', 'Facilities', 'Facility management, maintenance, and office services', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'legal', 'Legal', 'Legal services, compliance, and contract management', true, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ====================
-- VERIFICATION QUERIES
-- ====================
-- Uncomment to verify the data was inserted correctly:

-- SELECT COUNT(*) as user_count FROM "user" WHERE username = 'system';
-- SELECT COUNT(*) as permission_count FROM permission;
-- SELECT COUNT(*) as role_count FROM role;
-- SELECT COUNT(*) as role_permission_count FROM role_permission;
-- SELECT COUNT(*) as business_line_count FROM business_line;

