import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  DataSource,
} from 'typeorm';
import { AuditableEntity } from '../../utils/auditable.entity';

@EventSubscriber()
export class RecordSubscriber
  implements EntitySubscriberInterface<AuditableEntity>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return AuditableEntity;
  }

  async beforeInsert(event: InsertEvent<AuditableEntity>) {
    if (event.entity instanceof AuditableEntity && !event.entity.recordId) {
      const repository = event.manager.getRepository(event.metadata.target);
      const tableName = event.metadata.tableName;

      // Get the maximum recordId from the database
      // Using raw query to avoid alias issues and properly handle the string-to-number conversion
      const result = await repository
        .createQueryBuilder(tableName)
        .select(
          `COALESCE(MAX(CAST("${tableName}"."recordId" AS INTEGER)), 0)`,
          'max',
        )
        .getRawOne();

      const nextRecordId = (parseInt(result.max) || 0) + 1;

      // Format as zero-padded 10-digit string
      event.entity.recordId = String(nextRecordId).padStart(10, '0');
    }
  }
}
