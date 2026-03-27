import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774613145774 implements MigrationInterface {
    name = 'Migration1774613145774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_new_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "new_role" "public"."user_new_role_enum" NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "new_role"`);
        await queryRunner.query(`DROP TYPE "public"."user_new_role_enum"`);
    }

}
