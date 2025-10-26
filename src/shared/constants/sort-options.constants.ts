export enum SortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
  NUMBER = 'number',
}

export const SORT_BY_OPTIONS = [
  { value: SortBy.CREATED_AT, label: 'Created Date' },
  { value: SortBy.UPDATED_AT, label: 'Updated Date' },
  { value: SortBy.PRIORITY, label: 'Priority' },
  { value: SortBy.STATUS, label: 'Status' },
  { value: SortBy.NUMBER, label: 'Case Number' },
];

export const SORT_BY_VALUES = Object.values(SortBy);
