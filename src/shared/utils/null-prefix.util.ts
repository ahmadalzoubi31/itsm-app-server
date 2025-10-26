// src/shared/utils/null-prefix.util.ts

export const NULL_PREFIX = '$null$';

/**
 * Converts $null$ prefix to actual null/empty values
 * @param value - The value to process
 * @returns The converted value
 */
export function fromNullPrefix(value: any): any {
  if (typeof value === 'string' && value === NULL_PREFIX) {
    return null;
  }
  return value;
}

/**
 * Converts null/empty values to $null$ prefix for API responses
 * @param value - The value to process
 * @returns The converted value with prefix
 */
export function toNullPrefix(value: any): any {
  if (value === null || value === '' || value === undefined) {
    return NULL_PREFIX;
  }
  return value;
}

/**
 * Checks if a value represents null/empty using prefixes
 * @param value - The value to check
 * @returns True if the value represents null/empty
 */
export function isNullPrefix(value: any): boolean {
  return value === NULL_PREFIX;
}

/**
 * Gets the actual value for comparison operations
 * @param value - The value to process
 * @returns The actual value for comparison
 */
export function getActualValue(value: any): any {
  return fromNullPrefix(value);
}
