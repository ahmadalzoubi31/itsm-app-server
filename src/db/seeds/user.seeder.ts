// src/db/seeds/user.seeder.ts
import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RoleEnum } from '../../users/constants/role.constant';
import { StatusEnum } from '../../shared/constants/status.constant';

export default class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);

    // Check if the user exists
    const user = await repository.findOneBy({ username: 'appadmin' });
    if (user) return;

    // Insert the user

    const sysUser = repository.create({
      id: '0745bd13-92f2-474e-8544-5018383c7b75',
      firstName: 'System',
      lastName: 'Admin',
      fullName: 'System Admin',
      username: 'system',
      email: 'system@example.com',
      password: '$2b$10$RUtdApx.W3fYY5QpGRHIZeVny.YUTCYXkEGdIxhWgprkxp22lV.fa',
      role: RoleEnum.ADMIN,
      status: StatusEnum.INACTIVE,
    });
    await repository.save(sysUser);
    const newUser = repository.create({
      id: '0745bd13-92f2-474e-8544-5018383c7b74',
      firstName: 'App',
      lastName: 'Admin',
      fullName: 'App Admin',
      username: 'appadmin',
      email: 'appadmin@example.com',
      password: '$2b$10$RUtdApx.W3fYY5QpGRHIZeVny.YUTCYXkEGdIxhWgprkxp22lV.fa',
      role: RoleEnum.ADMIN,
      status: StatusEnum.ACTIVE,
      createdById: '0745bd13-92f2-474e-8544-5018383c7b75',
      updatedById: '0745bd13-92f2-474e-8544-5018383c7b75',
    });
    await repository.save(newUser);

    // Set permissions relation (after save!)
    await repository
      .createQueryBuilder()
      .relation(User, 'permissions')
      .of(newUser.id)
      .add([
        'f6c299bc-b8ab-4bd9-a795-fb45c3326c6b',
        '56237d9a-cad8-4a4c-b1d4-2c890c17dfeb',
        '986f8159-f546-4423-9980-1b510ff44124',
        'f7f7377a-3266-4396-9369-573665511d41',
        '8776377a-3266-4396-9369-573665511d42',
        '8776377a-3266-4396-9369-573665511d43',
      ]);
  }
}
