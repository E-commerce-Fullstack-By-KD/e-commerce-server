import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Column, Entity } from 'typeorm';
import { UserRole } from 'src/common/enum';

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  is_deleted: boolean;
}
