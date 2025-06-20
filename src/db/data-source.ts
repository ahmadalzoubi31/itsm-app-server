import 'dotenv/config';

import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true',
  entities: [
    './src/users/entities/user.entity.ts',
    './src/auth/entities/refreshToken.entity.ts',
    './src/permissions/entities/permission.entity.ts',
    './src/incidents/entities/incident.entity.ts',
    './src/incidents/entities/incident-comment.entity.ts',
    './src/incidents/entities/incident-history.entity.ts',
  ], // covers dev and prod
  migrations: ['./db/migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  extra: {
    connectionLimit: 10,
  },
});
