import { Logger } from '@nestjs/common';
import 'dotenv/config';

import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refreshToken.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentComment } from '../incidents/entities/incident-comment.entity';
import { IncidentHistory } from '../incidents/entities/incident-history.entity';
import { Settings } from '../settings/entities/settings.entity';
import { SyncHistory } from '../ldap/entities/sync-history.entity';
import { StagedUser } from '../ldap/entities/staged-user.entity';
import { EmailTemplate } from '../email/entities/email-template.entity';
import { EmailQueue } from '../email/entities/email-queue.entity';
import { EmailStatistics } from '../email/entities/email-statistics.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { ServiceCard } from '../service-cards/entities/service-card.entity';
import { ServiceCategory } from '../service-cards/entities/service_category.entity';
import { ApprovalWorkflow } from '../service-cards/entities/approval_workflow.entity';
import { SLA } from '../service-cards/entities/sla.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';

import UserSeeder from './seeds/user.seeder';
import PermissionSeeder from './seeds/permission.seeder';
import SettingsSeeder from './seeds/settings.seeder';

export const dbDataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true',
  synchronize: process.env.NODE_ENV !== 'prod',
  logging: process.env.LOG_LEVEL === 'debug',
  extra: {
    connectionLimit: 10,
  },
  entities: [
    User,
    RefreshToken,
    Permission,
    Incident,
    IncidentComment,
    IncidentHistory,
    Settings,
    SyncHistory,
    StagedUser,
    EmailTemplate,
    EmailQueue,
    EmailStatistics,
    Group,
    GroupMember,
    ServiceCard,
    ServiceCategory,
    ApprovalWorkflow,
    SLA,
    ServiceRequest,
  ],
  seeds: [PermissionSeeder, UserSeeder, SettingsSeeder],
};

// Create and export the DataSource instance
const AppDataSource = new DataSource(dbDataSourceOptions);
export default AppDataSource;

// Helper function to initialize the DataSource and run seeders
export const initializeDataSource = async (runSeeds = true) => {
  const logger = new Logger('TypeORM');
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.log('Data Source has been initialized!');
    }

    if (runSeeds) {
      const { runSeeders } = await import('typeorm-extension');
      await runSeeders(AppDataSource, {
        seeds: dbDataSourceOptions.seeds,
      });
      logger.log('Seeders have been executed!');
    }

    return AppDataSource;
  } catch (error) {
    logger.error('Error during Data Source initialization:', error);
    throw error;
  }
};
