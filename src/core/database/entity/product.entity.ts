import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Collection } from './collection.entity';
import { ProductStatus } from 'src/common/enum';

const decimalToNumber = {
  to: (value?: number | null): string | null =>
    value === null || value === undefined ? null : value.toFixed(2),
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};

@Entity()
export class Product extends AbstractEntityClass {
  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  image_url: string[];

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalToNumber })
  list_price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, transformer: decimalToNumber })
  offer_price: number | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: false })
  is_deleted: boolean;

  /**
   * The admin user who created this product.
   * Property name is `created_by`; DB FK column is `user_id`.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  created_by: User;

  /**
   * Many-to-many with Collection.
   * @JoinTable lives here (owning side) — TypeORM auto-creates
   * the `product_collection(product_id, collection_id)` pivot table.
   */
  @ManyToMany(() => Collection, (collection) => collection.products, {
    cascade: true,
    eager: false,
  })
  @JoinTable({
    name: 'product_collection',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'collection_id', referencedColumnName: 'id' },
  })
  collections: Collection[];
}
