import { Injectable } from '@nestjs/common';
import { Action } from './enums/action.enum';
import { User } from '../users/entities/user.entity';
import {
  InferSubjects,
  MongoAbility,
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from '@casl/ability';
import { Incident } from '../incidents/entities/incident.entity';
import { RoleEnum } from '../users/constants/role.constant';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionNameEnum } from '../permissions/constants/permission-name.constant';
import { Settings } from '../settings/entities/settings.entity';
import { Group } from '../groups/entities/group.entity';
import { UsersService } from '../users/users.service';

type Subjects =
  | InferSubjects<
      | typeof Incident
      | typeof Permission
      | typeof User
      | typeof Settings
      | typeof Group
    >
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private usersService: UsersService) {}

  async createForUser(user: User): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Role-based permissions
    if (user.role === RoleEnum.ADMIN) {
      can(Action.Manage, 'all'); // Admin can manage all
    } else if (user.role === RoleEnum.AGENT) {
      can(Action.Read, Incident, { createdById: user.id }); // Agent can see only their tickets
    } else if (user.role === RoleEnum.USER) {
      // User can't see anything by default
    }

    // Get effective permissions (direct + group inherited)
    let effectivePermissions: Permission[] = [];
    try {
      effectivePermissions =
        await this.usersService.getEffectiveUserPermissions(user.id);
    } catch (error) {
      console.error('Error fetching effective permissions:', error);
      // Fallback to user permissions only
      effectivePermissions = user.permissions || [];
    }

    // Permission-based abilities (now includes group permissions)
    if (effectivePermissions && effectivePermissions.length > 0) {
      effectivePermissions.forEach((permission) => {
        switch (permission.name) {
          case PermissionNameEnum.INCIDENT_MASTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident);
            break;
          case PermissionNameEnum.INCIDENT_USER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.INCIDENT_SUBMITTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.INCIDENT_VIEWER:
            can(Action.Read, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.Foundation_People:
            can(Action.Manage, User);
            can(Action.Manage, Permission);
            break;
          case PermissionNameEnum.Foundation_SupportGroups:
            can(Action.Manage, Group);
            break;
          case PermissionNameEnum.System_Settings:
            can(Action.Manage, Settings);
            break;
        }
      });
    }

    cannot(Action.Delete, Incident, 'all'); // Nobody can delete incidents

    return build({
      // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  // Synchronous version for cases where we already have the effective permissions
  createForUserSync(
    user: User,
    effectivePermissions?: Permission[],
  ): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Role-based permissions
    if (user.role === RoleEnum.ADMIN) {
      can(Action.Manage, 'all'); // Admin can manage all
    } else if (user.role === RoleEnum.AGENT) {
      can(Action.Read, Incident, { createdById: user.id }); // Agent can see only their tickets
    } else if (user.role === RoleEnum.USER) {
      // User can't see anything by default
    }

    // Use provided effective permissions or fallback to user permissions
    const permissions = effectivePermissions || user.permissions || [];

    // Permission-based abilities
    if (permissions && permissions.length > 0) {
      permissions.forEach((permission) => {
        switch (permission.name) {
          case PermissionNameEnum.INCIDENT_MASTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident);
            break;
          case PermissionNameEnum.INCIDENT_USER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.INCIDENT_SUBMITTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.INCIDENT_VIEWER:
            can(Action.Read, Incident, { createdById: user.id });
            break;
          case PermissionNameEnum.Foundation_People:
            can(Action.Manage, User);
            can(Action.Manage, Permission);
            break;
          case PermissionNameEnum.Foundation_SupportGroups:
            can(Action.Manage, Group);
            break;
          case PermissionNameEnum.System_Settings:
            can(Action.Manage, Settings);
            break;
        }
      });
    }

    cannot(Action.Delete, Incident, 'all'); // Nobody can delete incidents

    return build({
      // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
