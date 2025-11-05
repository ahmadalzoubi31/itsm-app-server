import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1761989368677 implements MigrationInterface {
    name = 'Migrations1761989368677'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permission" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permission" DROP COLUMN "metadata"`);
    }

}
