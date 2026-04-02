import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { User } from './user.entity';

@Entity('addresses')
export class Address extends AbstractEntityClass {
  @Column()
  full_name: string;

  @Column()
  phone: string;

  @Column()
  address_line_1: string;

  @Column({ nullable: true })
  address_line_2: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  postal_code: string;

  @Column({ default: false })
  is_default: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
