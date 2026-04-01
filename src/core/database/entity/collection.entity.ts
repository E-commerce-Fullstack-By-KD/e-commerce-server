import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Column, Entity, ManyToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Collection extends AbstractEntityClass {
  @Column()
  name: string;

  @Column({ default: false })
  is_deleted: boolean;
  /**
   * Inverse side of Product.collections.
   * No @JoinTable here — it lives on the owning side (Product).
   */
  @ManyToMany(() => Product, (product) => product.collections)
  products: Product[];
}
