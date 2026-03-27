import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends AbstractEntityClass {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: false })
  is_verified: boolean;
}
