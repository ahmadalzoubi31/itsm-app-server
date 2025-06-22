// src/db/seeds/user.seeder.ts
import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';
import { hash } from 'bcrypt';

export default class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);

    // check if the user is exsit
    const user = await repository.findOneBy({ username: 'appadmin' });
    if (user) {
      return;
    }
    await repository.insert({
      id: '0745bd13-92f2-474e-8544-5018383c7b74',
      firstName: 'App',
      lastName: 'Admin',
      fullName: 'App Admin',
      username: 'appadmin',
      email: 'appadmin@example.com',
      password: await hash('P@ssw0rd', 10),
      role: Role.ADMIN,
      status: 'active',
    });
  }
}
