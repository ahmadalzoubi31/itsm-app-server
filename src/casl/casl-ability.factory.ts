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
import { Role } from '../users/enums/role.enum';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionName } from '../permissions/enums/permission-name.enum';

type Subjects =
  | InferSubjects<typeof Incident | typeof Permission | typeof User>
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Role-based permissions
    if (user.role === Role.ADMIN) {
      can(Action.Manage, 'all'); // Admin can manage all
    } else if (user.role === Role.AGENT) {
      can(Action.Read, Incident, { createdById: user.id }); // Agent can see only their tickets
    } else if (user.role === Role.USER) {
      // User can't see anything by default
    }

    // Permission-based abilities
    if (user.permissions && user.permissions.length > 0) {
      user.permissions.forEach((permission) => {
        switch (permission.name) {
          case PermissionName.INCIDENT_MASTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident);
            break;
          case PermissionName.INCIDENT_USER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionName.INCIDENT_SUBMITTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionName.INCIDENT_VIEWER:
            can(Action.Read, Incident, { createdById: user.id });
            break;
          case PermissionName.Foundation_People:
            can(Action.Manage, User);
            can(Action.Manage, Permission);
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
