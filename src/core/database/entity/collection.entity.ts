import { AbstractEntityClass } from 'src/common/entity/abstract-class.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Collection extends AbstractEntityClass {
  @Column()
  name: string;
}
