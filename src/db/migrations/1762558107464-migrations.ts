import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1762558107464 implements MigrationInterface {
    name = 'Migrations1762558107464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b2177905daa1bf150e743072d3"`);
        await queryRunner.query(`ALTER TABLE "group" RENAME COLUMN "key" TO "type"`);
        await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "group" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_09e988aa3bd3f79d5cf96fd636" ON "group" ("type", "businessLineId", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_09e988aa3bd3f79d5cf96fd636"`);
        await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "group" ADD "type" character varying(80) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "group" RENAME COLUMN "type" TO "key"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b2177905daa1bf150e743072d3" ON "group" ("key") `);
    }

}
