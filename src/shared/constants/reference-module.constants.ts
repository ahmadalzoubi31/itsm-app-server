export enum ReferenceModule {
  CASE = 'case',
  SERVICE_REQUEST = 'service_request',
  INCIDENT = 'incident',
  PROBLEM = 'problem',
  CHANGE = 'change',
}

export const REFERENCE_MODULE_OPTIONS = [
  { value: ReferenceModule.CASE, label: 'Case Management' },
  { value: ReferenceModule.SERVICE_REQUEST, label: 'Service Request' },
  { value: ReferenceModule.INCIDENT, label: 'Incident' },
  { value: ReferenceModule.PROBLEM, label: 'Problem' },
  { value: ReferenceModule.CHANGE, label: 'Change' },
];

export const REFERENCE_MODULE_VALUES = Object.values(ReferenceModule);
