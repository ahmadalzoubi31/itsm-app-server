import { Injectable } from '@nestjs/common';
import { Action } from './enums/action.enum';
import { User } from 'src/users/entities/user.entity';
import {
  InferSubjects,
  MongoAbility,
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from '@casl/ability';
import { Incident } from 'src/incidents/entities/incident.entity';
import { Role } from 'src/users/enums/role.enum';
import { PermissionEnum } from 'src/permissions/enums/permission.enum';

type Subjects = InferSubjects<typeof Incident | typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Role-based permissions
    if (user.role === Role.ADMIN) {
      can(Action.Read, 'all'); // Admin can see all tickets
    } else if (user.role === Role.AGENT) {
      can(Action.Read, Incident, { createdById: user.id }); // Agent can see only their tickets
    } else if (user.role === Role.USER) {
      // User can't see anything by default
    }

    // Permission-based abilities
    if (user.permissions && user.permissions.length > 0) {
      user.permissions.forEach((permission) => {
        switch (permission.name) {
          case PermissionEnum.MASTER:
            can(Action.Create, Incident);
            can(Action.Update, Incident);
            break;
          case PermissionEnum.USER:
            can(Action.Create, Incident);
            can(Action.Update, Incident, { createdById: user.id });
            break;
          case PermissionEnum.SUBMITTER:
            can(Action.Create, Incident);
            break;
          case PermissionEnum.VIEWER:
            can(Action.Read, Incident, { createdById: user.id });
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
