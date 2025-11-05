// src/shared/infra/subscribers/audit.subscriber.ts
import { EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { ClsStore } from '../cls/cls-store.interface';

@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(private readonly cls: ClsService<ClsStore>) {
    this.logger.log('AuditSubscriber initialized with ClsService');
  }

  /**
   * Only listen to entities that extend AuditableEntity
   */
  listenTo() {
    return AuditableEntity;
  }

  /**
   * Called before insert
   */
  beforeInsert(event: InsertEvent<any>) {
    const user = this.cls.get('user');

    if (!user) {
      this.logger.debug('No user in CLS context for insert operation');
      return;
    }

    // Set createdBy fields
    if (event.entity instanceof AuditableEntity) {
      event.entity.createdById = user.userId;
      event.entity.createdByName = user.username;

      // Also set updatedBy fields on creation
      event.entity.updatedById = user.userId;
      event.entity.updatedByName = user.username;

      this.logger.debug(
        `Setting audit fields for insert: userId=${user.userId}, username=${user.username}`,
      );
    }
  }

  /**
   * Called before update
   */
  beforeUpdate(event: UpdateEvent<any>) {
    const user = this.cls.get('user');

    if (!user) {
      this.logger.debug('No user in CLS context for update operation');
      return;
    }

    // Set updatedBy fields
    if (event.entity instanceof AuditableEntity) {
      event.entity.updatedById = user.userId;
      event.entity.updatedByName = user.username;

      this.logger.debug(
        `Setting audit fields for update: userId=${user.userId}, username=${user.username}`,
      );
    }
  }
}
