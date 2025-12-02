import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1764707438964 implements MigrationInterface {
    name = 'Migrations1764707438964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staged_user" DROP CONSTRAINT "FK_eaae1a9e9b94f6db0e51e7d4293"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP CONSTRAINT "FK_ff6dae98b1abeed95b90d75d5fe"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "recordId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "createdByName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "updatedByName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "syncLogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "importedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "importedById" uuid`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "importedByName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "rejectedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "rejectedById" uuid`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "rejectedByName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "rejectionReason" text`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP CONSTRAINT "UQ_4be3f7c33f57a64bc7add1ae47b"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "objectGUID"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "objectGUID" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "cn"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "cn" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "mail"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "mail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "sAMAccountName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "sAMAccountName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "displayName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "department"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "department" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "givenName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "givenName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "sn"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "sn" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "title" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "mobile"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "mobile" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "userPrincipalName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "userPrincipalName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "manager"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "manager" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."staged_user_status_enum"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "status" character varying(20) NOT NULL DEFAULT 'NEW'`);
        await queryRunner.query(`CREATE INDEX "IDX_b1a80dd011c413686ae89d3ea2" ON "staged_user" ("sAMAccountName") `);
        await queryRunner.query(`CREATE INDEX "IDX_1db9c8716d9bea30736ed62433" ON "staged_user" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_96f04340da898c5c061dbda4e7" ON "staged_user" ("syncLogId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4be3f7c33f57a64bc7add1ae47" ON "staged_user" ("objectGUID") `);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD CONSTRAINT "FK_96f04340da898c5c061dbda4e71" FOREIGN KEY ("syncLogId") REFERENCES "ldap_sync_log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staged_user" DROP CONSTRAINT "FK_96f04340da898c5c061dbda4e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4be3f7c33f57a64bc7add1ae47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96f04340da898c5c061dbda4e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1db9c8716d9bea30736ed62433"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1a80dd011c413686ae89d3ea2"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."staged_user_status_enum" AS ENUM('NEW', 'UPDATED', 'IMPORTED', 'DISABLED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "status" "public"."staged_user_status_enum" NOT NULL DEFAULT 'NEW'`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "manager"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "manager" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "userPrincipalName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "userPrincipalName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "mobile"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "mobile" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "title" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "sn"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "sn" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "givenName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "givenName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "department"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "department" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "displayName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "sAMAccountName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "sAMAccountName" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "mail"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "mail" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "cn"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "cn" character varying`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "objectGUID"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD "objectGUID" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD CONSTRAINT "UQ_4be3f7c33f57a64bc7add1ae47b" UNIQUE ("objectGUID")`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "rejectionReason"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "rejectedByName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "rejectedById"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "rejectedAt"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "importedByName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "importedById"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "importedAt"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "syncLogId"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "updatedByName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "createdByName"`);
        await queryRunner.query(`ALTER TABLE "staged_user" DROP COLUMN "recordId"`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD CONSTRAINT "FK_ff6dae98b1abeed95b90d75d5fe" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staged_user" ADD CONSTRAINT "FK_eaae1a9e9b94f6db0e51e7d4293" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
