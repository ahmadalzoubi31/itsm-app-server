import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1763634000236 implements MigrationInterface {
    name = 'Migrations1763634000236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_table_preference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "preferenceKey" character varying NOT NULL, "preferences" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c661d69cf92a52cdcc2b38634d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd18462b895524fa00442bbbd3" ON "user_table_preference" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3647e65112a6c9c2fe19c343e2" ON "user_table_preference" ("userId", "preferenceKey") `);
        await queryRunner.query(`ALTER TABLE "user_table_preference" ADD CONSTRAINT "FK_dd18462b895524fa00442bbbd31" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_table_preference" DROP CONSTRAINT "FK_dd18462b895524fa00442bbbd31"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3647e65112a6c9c2fe19c343e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd18462b895524fa00442bbbd3"`);
        await queryRunner.query(`DROP TABLE "user_table_preference"`);
    }

}
