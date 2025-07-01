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
    if (user.role === RoleEnum.ADMIN) {
      can(Action.Manage, 'all'); // Admin can manage all
    } else if (user.role === RoleEnum.AGENT) {
      can(Action.Read, Incident, { createdById: user.id }); // Agent can see only their tickets
    } else if (user.role === RoleEnum.USER) {
      // User can't see anything by default
    }

    // Permission-based abilities
    if (user.permissions && user.permissions.length > 0) {
      user.permissions.forEach((permission) => {
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
