import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES = [
  'users',
  'products',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'migrations',
];

export class EnableRowLevelSecurity1793724167598 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }
  }
}