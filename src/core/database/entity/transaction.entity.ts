import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Order } from './order.entity';
import { PaymentStatus } from 'src/common/enum';

const decimalToNumber = {
  to: (v?: number | null) => (v == null ? null : v.toFixed(2)),
  from: (v?: string | null) => (v == null ? null : Number(v)),
};

@Entity('payments')
export class Payment extends AbstractEntityClass {
  @Column({ unique: true })
  razorpay_order_id: string;

  @Column({ nullable: true })
  razorpay_payment_id: string;

  @Column({ nullable: true })
  razorpay_signature: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalToNumber })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
