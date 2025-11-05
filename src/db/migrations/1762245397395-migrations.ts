import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1762245397395 implements MigrationInterface {
    name = 'Migrations1762245397395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role" ADD "permissionCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "role" ADD "userCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "userCount"`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "permissionCount"`);
    }

}
