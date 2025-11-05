import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1762076154233 implements MigrationInterface {
    name = 'Migrations1762076154233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_deb59c09715314aed1866e18a8"`);
        await queryRunner.query(`ALTER TABLE "permission" ADD "category" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "category"`);
        await queryRunner.query(`CREATE INDEX "IDX_deb59c09715314aed1866e18a8" ON "user_permission" ("userId") `);
    }

}
