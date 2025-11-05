import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';
import { User } from '@modules/iam/users/entities/user.entity';
import { Group } from '@modules/iam/groups/entities/group.entity';
import { Membership } from '@modules/iam/membership/entities/membership.entity';
import { Role } from '@modules/iam/roles/entities/role.entity';
import { UserRole } from '@modules/iam/users/entities/user-role.entity';
import { GroupRole } from '@modules/iam/groups/entities/group-role.entity';
import { Permission } from '@modules/iam/permissions/entities/permission.entity';
import { RolePermission } from '@modules/iam/roles/entities/role-permission.entity';
import { UserPermission } from '@modules/iam/users/entities/user-permission.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Case } from '@modules/case/entities/case.entity';
import { CaseComment } from '@modules/case/entities/case-comment.entity';
import { CaseLink } from '@modules/case/entities/case-link.entity';
import { CaseAttachment } from '@modules/case/entities/case-attachment.entity';
import { RefreshToken } from '@modules/iam/auth/entities/refresh-token.entity';
import { TokenBlacklist } from '@modules/iam/auth/entities/token-blacklist.entity';
import { SlaTarget } from '@modules/sla/entities/sla-target.entity';
import { SlaTimer } from '@modules/sla/entities/sla-timer.entity';
import { EmailChannel } from '@modules/email/entities/email-channel.entity';
import { EmailInboundState } from '@modules/email/entities/email-inbound-state.entity';
import { EmailMessage } from '@modules/email/entities/email-message.entity';
import { EmailRoutingRule } from '@modules/email/entities/email-routing-rule.entity';
// import { UserNotifyPref } from '@modules/notify/entities/user-notify-pref.entity';
import { NotificationTemplate } from '@modules/email/entities/notification-template.entity';
import { AuditEvent } from '@modules/audit/entities/audit-event.entity';
import { Service } from '@modules/catalog/entities/service.entity';
import { RequestTemplate } from '@modules/catalog/entities/request-template.entity';
import { Request } from '@modules/request/entities/request.entity';
import { Workflow } from '@modules/workflow/entities/workflow.entity';

// Load environment variables
dotenv.config();

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'itsm',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    Group,
    Membership,
    Role,
    Case,
    Permission,
    RefreshToken,
    TokenBlacklist,
    UserRole,
    GroupRole,
    RolePermission,
    UserPermission,
    BusinessLine,
    CaseComment,
    CaseLink,
    CaseAttachment,
    SlaTarget,
    SlaTimer,
    EmailChannel,
    EmailInboundState,
    EmailMessage,
    EmailRoutingRule,
    NotificationTemplate,
    // UserNotifyPref,
    AuditEvent,
    Service,
    RequestTemplate,
    Request,
    Workflow,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  seeds: [__dirname + '/seeds/**/*.{ts,js}'],
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
