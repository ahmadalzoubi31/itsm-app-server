import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1764067362112 implements MigrationInterface {
    name = 'Migrations1764067362112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service" ADD "categoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service" ADD "subcategoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "request" ADD "categoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "request" ADD "subcategoryId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_cb169715cbb8c74f263ba192ca" ON "service" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_853d3e797da6bbe02469356bb1" ON "service" ("subcategoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dda8d233f214c9cbc1093e03a2" ON "request" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_56c6e1326ac58d178c0563c5c7" ON "request" ("subcategoryId") `);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "FK_cb169715cbb8c74f263ba192ca8" FOREIGN KEY ("categoryId") REFERENCES "case_category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "FK_853d3e797da6bbe02469356bb1d" FOREIGN KEY ("subcategoryId") REFERENCES "case_subcategory"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request" ADD CONSTRAINT "FK_dda8d233f214c9cbc1093e03a21" FOREIGN KEY ("categoryId") REFERENCES "case_category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request" ADD CONSTRAINT "FK_56c6e1326ac58d178c0563c5c7e" FOREIGN KEY ("subcategoryId") REFERENCES "case_subcategory"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request" DROP CONSTRAINT "FK_56c6e1326ac58d178c0563c5c7e"`);
        await queryRunner.query(`ALTER TABLE "request" DROP CONSTRAINT "FK_dda8d233f214c9cbc1093e03a21"`);
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_853d3e797da6bbe02469356bb1d"`);
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_cb169715cbb8c74f263ba192ca8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56c6e1326ac58d178c0563c5c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dda8d233f214c9cbc1093e03a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_853d3e797da6bbe02469356bb1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb169715cbb8c74f263ba192ca"`);
        await queryRunner.query(`ALTER TABLE "request" DROP COLUMN "subcategoryId"`);
        await queryRunner.query(`ALTER TABLE "request" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "subcategoryId"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "categoryId"`);
    }

}
