export enum SearchScopeEnum {
  SUB = 'SUB',
  ONE_LEVEL = 'ONE_LEVEL',
  BASE = 'BASE',
}

export const SEARCH_SCOPES = [
  { value: SearchScopeEnum.SUB, label: 'sub' },
  { value: SearchScopeEnum.ONE_LEVEL, label: 'One Level' },
  { value: SearchScopeEnum.BASE, label: 'Base' },
] as const;
