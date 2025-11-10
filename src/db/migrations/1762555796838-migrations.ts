import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1762555796838 implements MigrationInterface {
    name = 'Migrations1762555796838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isLicensed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isLicensed"`);
    }

}
