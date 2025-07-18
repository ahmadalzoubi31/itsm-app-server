import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupPermissions1752874941034 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create group_permissions junction table
    await queryRunner.query(`
            CREATE TABLE "group_permissions" (
                "group_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_group_permissions" PRIMARY KEY ("group_id", "permission_id")
            )
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "group_permissions" 
            ADD CONSTRAINT "FK_group_permissions_group" 
            FOREIGN KEY ("group_id") REFERENCES "groups"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "group_permissions" 
            ADD CONSTRAINT "FK_group_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

    // Add indexes for better performance
    await queryRunner.query(`
            CREATE INDEX "IDX_group_permissions_group_id" ON "group_permissions" ("group_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_group_permissions_permission_id" ON "group_permissions" ("permission_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX "IDX_group_permissions_permission_id"`);
    await queryRunner.query(`DROP INDEX "IDX_group_permissions_group_id"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "group_permissions" DROP CONSTRAINT "FK_group_permissions_permission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_permissions" DROP CONSTRAINT "FK_group_permissions_group"`,
    );

    // Drop the table
    await queryRunner.query(`DROP TABLE "group_permissions"`);
  }
}
