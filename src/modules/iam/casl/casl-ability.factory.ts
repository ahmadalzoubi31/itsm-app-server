import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { JwtUser } from '@shared/types/jwt-user.type';
import { Injectable } from '@nestjs/common';
import { Case } from '@modules/case/entities/case.entity';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { Permission } from '../permissions/entities/permission.entity';
import { IamPermissionService } from '../core/iam-permission.service';

type Subjects = InferSubjects<typeof Case> | 'all';

export type AppAbility = MongoAbility<[IAM_ACTIONS, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly permissionService: IamPermissionService) {}

  async createForUser(user: JwtUser): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Load permissions from the permission service
    const permissions = await this.permissionService.getEffectivePermissions(
      user.userId,
      user.groupIds || [],
    );

    // Build CASL rules from permissions
    for (const perm of permissions) {
      const action = perm.action as IAM_ACTIONS;
      const subject = this.resolveSubject(perm.subject);
      const conditions = this.parseConditions(perm.conditions, user);

      if (conditions) {
        can(action, subject, conditions);
      } else {
        can(action, subject);
      }
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  /**
   * Resolve subject string to actual class or 'all'
   */
  private resolveSubject(subject: string): any {
    const subjectMap: Record<string, any> = {
      Case: Case,
      all: 'all',
    };
    return subjectMap[subject] || subject;
  }

  /**
   * Parse conditions JSON and replace $user.* placeholders with actual values
   * Examples:
   * - {"op": "eq", "field": "requesterId", "value": "$user.id"} -> { requesterId: user.userId }
   * - {"op": "in", "field": "assignmentGroupId", "value": "$user.groupIds"} -> { assignmentGroupId: { $in: user.groupIds } }
   */
  private parseConditions(
    conditions: Record<string, any> | null | undefined,
    user: JwtUser,
  ): Record<string, any> | null {
    if (!conditions) return null;

    // Handle simple condition format: { op, field, value }
    if (conditions.op && conditions.field) {
      const value = this.resolveValue(conditions.value, user);
      const field = conditions.field;

      switch (conditions.op) {
        case 'eq':
          return { [field]: value };
        case 'in':
          return { [field]: { $in: Array.isArray(value) ? value : [value] } };
        case 'ne':
          return { [field]: { $ne: value } };
        case 'gt':
          return { [field]: { $gt: value } };
        case 'gte':
          return { [field]: { $gte: value } };
        case 'lt':
          return { [field]: { $lt: value } };
        case 'lte':
          return { [field]: { $lte: value } };
        default:
          return { [field]: value };
      }
    }

    // Handle direct MongoDB-style conditions: { requesterId: "$user.id" }
    const parsed: Record<string, any> = {};
    for (const [key, val] of Object.entries(conditions)) {
      parsed[key] = this.resolveValue(val, user);
    }
    return parsed;
  }

  /**
   * Replace $user.* placeholders with actual user values
   */
  private resolveValue(value: any, user: JwtUser): any {
    if (typeof value === 'string' && value.startsWith('$user.')) {
      const path = value.substring(6); // Remove "$user."
      switch (path) {
        case 'id':
        case 'userId':
          return user.userId;
        case 'username':
          return user.username;
        case 'role':
          return user.role;
        case 'groupIds':
          return user.groupIds || [];
        default:
          return value;
      }
    }
    return value;
  }
}
