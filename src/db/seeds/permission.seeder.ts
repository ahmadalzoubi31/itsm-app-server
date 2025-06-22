// src/db/seeds/permission.seeder.ts
import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { PermissionName } from '../../permissions/enums/permission-name.enum';
import { PermissionCategory } from '../../permissions/enums/permission-category.enum';

export default class PermissionSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Permission);

    // check if the permission is exsit
    const permission = await repository.findOneBy({
      name: PermissionName.Foundation_People,
    });
    if (permission) {
      return;
    }

    // check if the permission is exsit
    await repository.insert([
      {
        id: 'f6c299bc-b8ab-4bd9-a795-fb45c3326c6b',
        name: PermissionName.Foundation_People,
        category: PermissionCategory.FOUNDATION,
        description: 'Create and modify people',
      },
      {
        id: '56237d9a-cad8-4a4c-b1d4-2c890c17dfeb',
        name: PermissionName.Foundation_SupportGroup,
        category: PermissionCategory.FOUNDATION,
        description: 'Create and modify support groups',
      },
      {
        id: '673cee96-da47-4255-9212-d41f592b0b6d',
        name: PermissionName.Foundation_Category,
        category: PermissionCategory.FOUNDATION,
        description: 'Create and modify categories',
      },
      {
        id: '986f8159-f546-4423-9980-1b510ff44124',
        name: PermissionName.INCIDENT_MASTER,
        category: PermissionCategory.INCIDENT,
        description: 'Create and modify incidents to all accessed incidents',
      },
      {
        id: 'f7f7377a-3266-4396-9369-573665511d41',
        name: PermissionName.INCIDENT_USER,
        category: PermissionCategory.INCIDENT,
        description: 'Create and modify incidents to all assigned incidents',
      },
      {
        id: '8776377a-3266-4396-9369-573665511d42',
        name: PermissionName.INCIDENT_SUBMITTER,
        category: PermissionCategory.INCIDENT,
        description: 'Create incidents',
      },
      {
        id: '8776377a-3266-4396-9369-573665511d43',
        name: PermissionName.INCIDENT_VIEWER,
        category: PermissionCategory.INCIDENT,
        description: 'View incidents',
      },
    ]);
  }
}
