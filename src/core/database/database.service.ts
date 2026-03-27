import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

@Injectable()
export class OrmService {
  constructor(private readonly dataSource: DataSource) {}

  getRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }
}
