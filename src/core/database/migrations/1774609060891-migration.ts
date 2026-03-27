import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774609060891 implements MigrationInterface {
    name = 'Migration1774609060891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "collection" ("id" SERIAL NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "PK_ad3f485bbc99d875491f44d7c85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."product_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'DRAFT')`);
        await queryRunner.query(`ALTER TABLE "product" ADD "status" "public"."product_status_enum" NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "product" ADD "userIdId" integer`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_e2fb675849fe8e884a0751588ae" FOREIGN KEY ("userIdId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_e2fb675849fe8e884a0751588ae"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "userIdId"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."product_status_enum"`);
        await queryRunner.query(`DROP TABLE "collection"`);
    }

}
