export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const SORT_DIRECTION_OPTIONS = [
  { value: SortDirection.ASC, label: 'Ascending' },
  { value: SortDirection.DESC, label: 'Descending' },
];

export const SORT_DIRECTION_VALUES = Object.values(SortDirection);
