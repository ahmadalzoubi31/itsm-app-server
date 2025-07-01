import { MigrationInterface, QueryRunner } from "typeorm";

export class Init011751190364238 implements MigrationInterface {
    name = 'Init011751190364238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiry" TIMESTAMP NOT NULL, "issuedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "REL_610102b60fea1455310ccd299d" UNIQUE ("userId"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."permissions_name_enum" NOT NULL, "category" "public"."permissions_category_enum" NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "fullName" character varying NOT NULL, "username" character varying NOT NULL, "email" character varying, "password" character varying, "role" "public"."users_role_enum" NOT NULL, "phone" character varying, "address" character varying, "status" character varying NOT NULL DEFAULT 'active', "createdById" uuid, "updatedById" uuid, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "incident_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "comment" character varying NOT NULL, "isPrivate" boolean NOT NULL, "incidentId" uuid NOT NULL, "createdById" uuid, "updatedById" uuid, CONSTRAINT "PK_a17275da5243738996bbba7327d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "incident_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "field" character varying NOT NULL, "oldValue" character varying, "newValue" character varying, "incidentId" uuid NOT NULL, "createdById" uuid, "updatedById" uuid, CONSTRAINT "PK_c589f3697204f95846350f700b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."incidents_status_enum" NOT NULL, "priority" "public"."incidents_priority_enum" NOT NULL, "impact" "public"."incidents_impact_enum" NOT NULL, "urgency" "public"."incidents_urgency_enum" NOT NULL, "category" character varying NOT NULL, "subcategory" character varying, "resolution" character varying, "businessService" character varying NOT NULL, "location" character varying, "createdById" uuid, "updatedById" uuid, CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_permissions" ("user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_a537c48b1f80e8626a71cb56589" PRIMARY KEY ("user_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3495bd31f1862d02931e8e8d2e" ON "user_permissions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8145f5fadacd311693c15e41f1" ON "user_permissions" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_52e97c477859f8019f3705abd21" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_comments" ADD CONSTRAINT "FK_49e548c253b35077692b337fcd4" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_comments" ADD CONSTRAINT "FK_f24eae1d752bb234ba74aea3ec5" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_comments" ADD CONSTRAINT "FK_721d05400caa2057de33fa43987" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_histories" ADD CONSTRAINT "FK_c9f8817651ca62d73b6bfb1dba2" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_histories" ADD CONSTRAINT "FK_b05afa182a2f6b33e6b42e18ffd" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_histories" ADD CONSTRAINT "FK_97f5dda3e14e8d578771a8aecb8" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_d5efaf30d8cb508318ce25df35c" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_d614a0dd115af340da2fc46c8e2" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_d614a0dd115af340da2fc46c8e2"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_d5efaf30d8cb508318ce25df35c"`);
        await queryRunner.query(`ALTER TABLE "incident_histories" DROP CONSTRAINT "FK_97f5dda3e14e8d578771a8aecb8"`);
        await queryRunner.query(`ALTER TABLE "incident_histories" DROP CONSTRAINT "FK_b05afa182a2f6b33e6b42e18ffd"`);
        await queryRunner.query(`ALTER TABLE "incident_histories" DROP CONSTRAINT "FK_c9f8817651ca62d73b6bfb1dba2"`);
        await queryRunner.query(`ALTER TABLE "incident_comments" DROP CONSTRAINT "FK_721d05400caa2057de33fa43987"`);
        await queryRunner.query(`ALTER TABLE "incident_comments" DROP CONSTRAINT "FK_f24eae1d752bb234ba74aea3ec5"`);
        await queryRunner.query(`ALTER TABLE "incident_comments" DROP CONSTRAINT "FK_49e548c253b35077692b337fcd4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_52e97c477859f8019f3705abd21"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8145f5fadacd311693c15e41f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3495bd31f1862d02931e8e8d2e"`);
        await queryRunner.query(`DROP TABLE "user_permissions"`);
        await queryRunner.query(`DROP TABLE "incidents"`);
        await queryRunner.query(`DROP TABLE "incident_histories"`);
        await queryRunner.query(`DROP TABLE "incident_comments"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
