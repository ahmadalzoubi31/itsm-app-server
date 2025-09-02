import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigToServiceCard1753555555555 implements MigrationInterface {
  name = 'AddConfigToServiceCard1753555555555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_card\` ADD \`config\` json NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_card\` DROP COLUMN \`config\``,
    );
  }
}
