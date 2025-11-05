export enum RequestType {
  SERVICE_REQUEST = 'ServiceRequest',
  INCIDENT = 'Incident',
}

export const REQUEST_TYPE_OPTIONS = [
  { value: RequestType.SERVICE_REQUEST, label: 'Service Request' },
  { value: RequestType.INCIDENT, label: 'Incident' },
];

export const REQUEST_TYPE_VALUES = Object.values(RequestType);
