export enum FrequencyEnum {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const FREQUENCIES = [
  { value: FrequencyEnum.HOURLY, label: 'Hourly' },
  { value: FrequencyEnum.DAILY, label: 'Daily' },
  { value: FrequencyEnum.WEEKLY, label: 'Weekly' },
  { value: FrequencyEnum.MONTHLY, label: 'Monthly' },
] as const;
