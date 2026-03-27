import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774613097358 implements MigrationInterface {
    name = 'Migration1774613097358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "verification_token" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "verification_token"`);
    }

}
