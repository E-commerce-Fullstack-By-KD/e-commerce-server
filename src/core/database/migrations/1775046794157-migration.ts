import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775046794157 implements MigrationInterface {
    name = 'Migration1775046794157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "offer_price" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "offer_price" SET NOT NULL`);
    }

}
