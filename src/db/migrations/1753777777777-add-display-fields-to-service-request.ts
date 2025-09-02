import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisplayFieldsToServiceRequest1753777777777
  implements MigrationInterface
{
  name = 'AddDisplayFieldsToServiceRequest1753777777777';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`serviceName\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`title\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`requestedBy\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`requestedDate\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`estimatedCompletion\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`estimatedCompletion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`requestedDate\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`requestedBy\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`title\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`serviceName\``,
    );
  }
}
