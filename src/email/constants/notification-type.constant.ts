export enum NotificationTypeEnum {
  INCIDENT_CREATED = "INCIDENT_CREATED",
  INCIDENT_UPDATED = "INCIDENT_UPDATED",
  INCIDENT_RESOLVED = "INCIDENT_RESOLVED",
  SERVICE_REQUEST_CREATED = "SERVICE_REQUEST_CREATED",
  SERVICE_REQUEST_APPROVED = "SERVICE_REQUEST_APPROVED",
  SERVICE_REQUEST_REJECTED = "SERVICE_REQUEST_REJECTED",
  USER_CREATED = "USER_CREATED",
  SYSTEM_ALERT = "SYSTEM_ALERT",
  LDAP_SYNC_STATUS = "LDAP_SYNC_STATUS"
}

export const NOTIFICATION_TYPES = [
  {
    value: NotificationTypeEnum.INCIDENT_CREATED,
    label: "Incident Created",
    description: "When a new incident is created",
    category: "Incidents",
    defaultEnabled: true,
    priority: "high"
  },
  {
    value: NotificationTypeEnum.INCIDENT_UPDATED,
    label: "Incident Updated",
    description: "When an incident is updated or modified",
    category: "Incidents",
    defaultEnabled: true,
    priority: "medium"
  },
  {
    value: NotificationTypeEnum.INCIDENT_RESOLVED,
    label: "Incident Resolved",
    description: "When an incident is marked as resolved",
    category: "Incidents",
    defaultEnabled: true,
    priority: "medium"
  },
  {
    value: NotificationTypeEnum.SERVICE_REQUEST_CREATED,
    label: "Service Request Created",
    description: "When a new service request is submitted",
    category: "Service Requests",
    defaultEnabled: true,
    priority: "low"
  },
  {
    value: NotificationTypeEnum.SERVICE_REQUEST_APPROVED,
    label: "Service Request Approved",
    description: "When a service request is approved",
    category: "Service Requests",
    defaultEnabled: true,
    priority: "medium"
  },
  {
    value: NotificationTypeEnum.SERVICE_REQUEST_REJECTED,
    label: "Service Request Rejected",
    description: "When a service request is rejected",
    category: "Service Requests",
    defaultEnabled: true,
    priority: "medium"
  },
  {
    value: NotificationTypeEnum.USER_CREATED,
    label: "User Created",
    description: "When a new user account is created",
    category: "User Management",
    defaultEnabled: false,
    priority: "low"
  },
  {
    value: NotificationTypeEnum.SYSTEM_ALERT,
    label: "System Alert",
    description: "Critical system alerts and maintenance notifications",
    category: "System",
    defaultEnabled: true,
    priority: "critical"
  },
  {
    value: NotificationTypeEnum.LDAP_SYNC_STATUS,
    label: "LDAP Sync Status",
    description: "LDAP synchronization status updates",
    category: "System",
    defaultEnabled: false,
    priority: "low"
  }
];


export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  notificationTypes: [
    NotificationTypeEnum.INCIDENT_CREATED,
    NotificationTypeEnum.INCIDENT_UPDATED,
    NotificationTypeEnum.INCIDENT_RESOLVED,
    NotificationTypeEnum.SERVICE_REQUEST_CREATED,
    NotificationTypeEnum.SERVICE_REQUEST_APPROVED,
    NotificationTypeEnum.SERVICE_REQUEST_REJECTED,
    NotificationTypeEnum.SYSTEM_ALERT
  ],
  defaultRecipients: [],
  urgentRecipients: [],
  ccRecipients: [],
  bccRecipients: [],
  subjectPrefix: "[ITSM]",
  includeAttachments: false,
  maxAttachmentSize: 10,
  retryAttempts: 3,
  retryDelay: 60,
  batchSize: 50,
  throttleLimit: 100
}; 