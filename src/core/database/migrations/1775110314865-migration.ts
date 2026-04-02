import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775110314865 implements MigrationInterface {
    name = 'Migration1775110314865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "full_name" character varying NOT NULL, "phone" character varying NOT NULL, "address_line_1" character varying NOT NULL, "address_line_2" character varying, "city" character varying NOT NULL, "state" character varying NOT NULL, "country" character varying NOT NULL, "postal_code" character varying NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "user_id" integer, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
