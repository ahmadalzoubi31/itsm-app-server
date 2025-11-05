// ===== CASE EVENTS =====

export class CaseCreatedEvent {
  constructor(
    public readonly caseId: string,
    public readonly payload: {
      businessLineId: string;
      priority: string;
      requesterId: string;
      createdAt: string;
    },
  ) {}
}

export class CaseAssignedEvent {
  constructor(
    public readonly caseId: string,
    public readonly payload: {
      assigneeId: string;
      assigneeName: string;
    },
  ) {}
}

export class CaseGroupAssignedEvent {
  constructor(
    public readonly caseId: string,
    public readonly payload: {
      groupId: string;
    },
  ) {}
}

export class CaseStatusChangedEvent {
  constructor(
    public readonly caseId: string,
    public readonly payload: {
      before: {
        status?: string;
      };
      after: {
        status?: string;
      };
      actor: { actorId: string; actorName: string };
      updatedAt: string;
    },
  ) {}
}

// ===== REQUEST EVENTS =====

export class RequestCreatedEvent {
  constructor(
    public readonly requestId: string,
    public readonly payload: {
      businessLineId: string;
      type: string;
      priority: string;
      requesterId: string;
      createdAt: string;
    },
  ) {}
}

export class RequestAssignedEvent {
  constructor(
    public readonly requestId: string,
    public readonly payload: {
      assigneeId: string;
      assigneeName: string;
    },
  ) {}
}

export class RequestStatusChangedEvent {
  constructor(
    public readonly requestId: string,
    public readonly payload: {
      before: {
        status?: string;
      };
      after: {
        status?: string;
      };
      actor: { actorId: string; actorName: string };
      updatedAt: string;
    },
  ) {}
}

export class SlaBreachedEvent {
  constructor(
    public readonly caseId: string,
    public readonly payload: {
      metric: 'resolution' | 'first_response';
      targetAt: string;
      at: string;
    },
  ) {}
}

// ===== IAM EVENTS =====

// User Management Events
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly payload: {
      username: string;
      email?: string;
      authSource: 'local' | 'ldap';
      createdBy?: string;
      createdAt: string;
    },
  ) {}
}

export type UserUpdated = {
  type: 'user.updated';
  userId: string;
  username: string;
  changes: Record<string, any>;
  updatedBy?: string;
  updatedAt: string;
};

export type UserDeleted = {
  type: 'user.deleted';
  userId: string;
  username: string;
  deletedBy?: string;
  deletedAt: string;
};

export type UserActivated = {
  type: 'user.activated';
  userId: string;
  username: string;
  activatedBy?: string;
  activatedAt: string;
};

export type UserDeactivated = {
  type: 'user.deactivated';
  userId: string;
  username: string;
  deactivatedBy?: string;
  deactivatedAt: string;
};

// Authentication Events
export type UserLoginSuccess = {
  type: 'user.login.success';
  userId: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: string;
};

export type UserLoginFailed = {
  type: 'user.login.failed';
  username: string;
  ipAddress?: string;
  userAgent?: string;
  reason: 'invalid_credentials' | 'account_disabled' | 'account_locked';
  failedAt: string;
};

export type UserLogout = {
  type: 'user.logout';
  userId: string;
  username: string;
  logoutType: 'single' | 'all_devices';
  logoutAt: string;
};

export type UserPasswordChanged = {
  type: 'user.password.changed';
  userId: string;
  username: string;
  changedBy?: string; // null if self-changed
  changedAt: string;
};

export type UserPasswordReset = {
  type: 'user.password.reset';
  userId: string;
  username: string;
  resetBy?: string;
  resetAt: string;
};

export type TokenBlacklisted = {
  type: 'token.blacklisted';
  jti: string;
  userId: string;
  reason: 'logout' | 'logout_all' | 'password_changed' | 'account_deactivated';
  blacklistedAt: string;
};

// Role & Permission Events
export type UserRoleAssigned = {
  type: 'user.role.assigned';
  userId: string;
  username: string;
  roleId: string;
  roleName: string;
  assignedBy?: string;
  assignedAt: string;
};

export type UserRoleRevoked = {
  type: 'user.role.revoked';
  userId: string;
  username: string;
  roleId: string;
  roleName: string;
  revokedBy?: string;
  revokedAt: string;
};

export type UserPermissionGranted = {
  type: 'user.permission.granted';
  userId: string;
  username: string;
  permissionId: string;
  permissionKey: string;
  grantedBy?: string;
  grantedAt: string;
};

export type UserPermissionRevoked = {
  type: 'user.permission.revoked';
  userId: string;
  username: string;
  permissionId: string;
  permissionKey: string;
  revokedBy?: string;
  revokedAt: string;
};

// Group Management Events
export type GroupCreated = {
  type: 'group.created';
  groupId: string;
  groupName: string;
  createdBy?: string;
  createdAt: string;
};

export type GroupUpdated = {
  type: 'group.updated';
  groupId: string;
  groupName: string;
  changes: Record<string, any>;
  updatedBy?: string;
  updatedAt: string;
};

export type GroupDeleted = {
  type: 'group.deleted';
  groupId: string;
  groupName: string;
  deletedBy?: string;
  deletedAt: string;
};

export type GroupRoleAssigned = {
  type: 'group.role.assigned';
  groupId: string;
  groupName: string;
  roleId: string;
  roleName: string;
  memberCount: number; // Number of users affected
  assignedBy?: string;
  assignedAt: string;
};

export type GroupRoleRevoked = {
  type: 'group.role.revoked';
  groupId: string;
  groupName: string;
  roleId: string;
  roleName: string;
  memberCount: number; // Number of users affected
  revokedBy?: string;
  revokedAt: string;
};

export type UserGroupJoined = {
  type: 'user.group.joined';
  userId: string;
  username: string;
  groupId: string;
  groupName: string;
  joinedBy?: string;
  joinedAt: string;
};

export type UserGroupLeft = {
  type: 'user.group.left';
  userId: string;
  username: string;
  groupId: string;
  groupName: string;
  leftBy?: string;
  leftAt: string;
};

// Security Events
export type SuspiciousActivity = {
  type: 'suspicious.activity';
  userId?: string;
  username?: string;
  activity:
    | 'multiple_failed_logins'
    | 'unusual_location'
    | 'permission_escalation';
  details: Record<string, any>;
  detectedAt: string;
};

export type PermissionEscalation = {
  type: 'permission.escalation';
  userId: string;
  username: string;
  escalatedPermission: string;
  escalatedBy: string;
  escalatedAt: string;
};
