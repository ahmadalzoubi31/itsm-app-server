import { registerAs } from '@nestjs/config';
import { RefreshToken } from 'src/auth/entities/refreshToken.entity';
import { User } from 'src/users/entities/user.entity';
import { Incident } from 'src/incidents/entities/incident.entity';
import { IncidentComment } from 'src/incidents/entities/comment.entity';
import { IncidentHistory } from 'src/incidents/entities/history.entity';
import { TlsOptions } from 'tls';
import { MixedList, EntitySchema } from 'typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';

interface DbConnectionSchema {
  type: 'postgres' | undefined;
  host: string | undefined;
  port: number | undefined;
  username: string | undefined;
  password: string | (() => string) | (() => Promise<string>) | undefined;
  database: string | undefined;
  ssl: boolean | TlsOptions | undefined;
  entities: MixedList<string | Function | EntitySchema<any>> | undefined;
  synchronize: boolean | undefined;
}
export default registerAs(
  'database',
  (): DbConnectionSchema => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: +process.env.DATABASE_PORT!,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true',
    entities: [
      User,
      RefreshToken,
      Incident,
      IncidentComment,
      IncidentHistory,
      Permission,
    ],
    synchronize: true,
  }),
);
