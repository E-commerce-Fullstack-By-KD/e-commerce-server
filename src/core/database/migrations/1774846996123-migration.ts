import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774846996123 implements MigrationInterface {
    name = 'Migration1774846996123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_e2fb675849fe8e884a0751588ae"`);
        await queryRunner.query(`CREATE TABLE "product_collection" ("product_id" integer NOT NULL, "collection_id" integer NOT NULL, CONSTRAINT "PK_11e5864c97460c85870af629254" PRIMARY KEY ("product_id", "collection_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_339ecc9827594501895301ffec" ON "product_collection" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2346dc7fab96336a85a6418b77" ON "product_collection" ("collection_id") `);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "userIdId"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "product" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_3e59a34134d840e83c2010fac9a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_collection" ADD CONSTRAINT "FK_339ecc9827594501895301ffec7" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_collection" ADD CONSTRAINT "FK_2346dc7fab96336a85a6418b776" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_collection" DROP CONSTRAINT "FK_2346dc7fab96336a85a6418b776"`);
        await queryRunner.query(`ALTER TABLE "product_collection" DROP CONSTRAINT "FK_339ecc9827594501895301ffec7"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_3e59a34134d840e83c2010fac9a"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "userIdId" integer`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2346dc7fab96336a85a6418b77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_339ecc9827594501895301ffec"`);
        await queryRunner.query(`DROP TABLE "product_collection"`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_e2fb675849fe8e884a0751588ae" FOREIGN KEY ("userIdId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
