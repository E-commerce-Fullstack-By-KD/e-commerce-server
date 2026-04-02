import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Order } from './order.entity';
import { Product } from './product.entity';

const decimalToNumber = {
  to: (v?: number | null) => (v == null ? null : v.toFixed(2)),
  from: (v?: string | null) => (v == null ? null : Number(v)),
};

@Entity('order_items')
export class OrderItem extends AbstractEntityClass {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalToNumber })
  unit_price: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalToNumber })
  total_price: number;
}
