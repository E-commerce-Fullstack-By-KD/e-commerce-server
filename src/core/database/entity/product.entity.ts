import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Collection } from './collection.entity';
import { ProductStatus } from 'src/common/enum';

@Entity()
export class Product extends AbstractEntityClass {
  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column('text', { array: true, nullable: true })
  image_url: string[];

  @Column('decimal', { precision: 10, scale: 2 })
  list_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  offer_price: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ default: 0 })
  stock: number;

  @ManyToOne(() => User)
  user_id: User;

  @ManyToMany(() => Collection)
  collections: Collection;
}
