// src/db/seeds/permission.seeder.ts
import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { PermissionNameEnum } from '../../permissions/contants/permission-name.constant';
import { PermissionCategoryEnum } from '../../permissions/contants/permission-category.constant';

export default class PermissionSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Permission);

    // check if the permission is exsit
    const permission = await repository.findOneBy({
      name: PermissionNameEnum.Foundation_People,
    });
    if (permission) {
      return;
    }

    // check if the permission is exsit
    await repository.insert([
      {
        id: 'f6c299bc-b8ab-4bd9-a795-fb45c3326c6b',
        name: PermissionNameEnum.Foundation_People,
        category: PermissionCategoryEnum.FOUNDATION,
        description: 'Create and modify people',
      },
      {
        id: '56237d9a-cad8-4a4c-b1d4-2c890c17dfeb',
        name: PermissionNameEnum.Foundation_SupportGroup,
        category: PermissionCategoryEnum.FOUNDATION,
        description: 'Create and modify support groups',
      },
      {
        id: '673cee96-da47-4255-9212-d41f592b0b6d',
        name: PermissionNameEnum.Foundation_Category,
        category: PermissionCategoryEnum.FOUNDATION,
        description: 'Create and modify categories',
      },
      {
        id: '986f8159-f546-4423-9980-1b510ff44124',
        name: PermissionNameEnum.INCIDENT_MASTER,
        category: PermissionCategoryEnum.INCIDENT,
        description: 'Create and modify incidents to all accessed incidents',
      },
      {
        id: 'f7f7377a-3266-4396-9369-573665511d41',
        name: PermissionNameEnum.INCIDENT_USER,
        category: PermissionCategoryEnum.INCIDENT,
        description: 'Create and modify incidents to all assigned incidents',
      },
      {
        id: '8776377a-3266-4396-9369-573665511d42',
        name: PermissionNameEnum.INCIDENT_SUBMITTER,
        category: PermissionCategoryEnum.INCIDENT,
        description: 'Create incidents',
      },
      {
        id: '8776377a-3266-4396-9369-573665511d43',
        name: PermissionNameEnum.INCIDENT_VIEWER,
        category: PermissionCategoryEnum.INCIDENT,
        description: 'View incidents',
      },
    ]);
  }
}
