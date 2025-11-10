import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1762590519360 implements MigrationInterface {
    name = 'Migrations1762590519360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "membership" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid, "createdByName" character varying, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedById" uuid, "updatedByName" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "groupId" uuid NOT NULL, CONSTRAINT "PK_83c1afebef3059472e7c37e8de8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8bc1674087575acecf0a648fc9" ON "membership" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_eef2d9d9c70cd13bed868afedf" ON "membership" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c7d697a4844cf8b931988b24f" ON "membership" ("userId", "groupId") `);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_eef2d9d9c70cd13bed868afedf4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_8bc1674087575acecf0a648fc91" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_8bc1674087575acecf0a648fc91"`);
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_eef2d9d9c70cd13bed868afedf4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c7d697a4844cf8b931988b24f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eef2d9d9c70cd13bed868afedf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8bc1674087575acecf0a648fc9"`);
        await queryRunner.query(`DROP TABLE "membership"`);
    }

}
