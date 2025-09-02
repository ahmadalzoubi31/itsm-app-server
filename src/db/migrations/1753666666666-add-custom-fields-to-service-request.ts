import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomFieldsToServiceRequest1753666666666
  implements MigrationInterface
{
  name = 'AddCustomFieldsToServiceRequest1753666666666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_request\` ADD \`customFieldValues\` json NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`service_request\` DROP COLUMN \`customFieldValues\``,
    );
  }
}
