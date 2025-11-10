// src/db/scripts/reorder-migration-file.ts
import * as fs from 'fs';
import * as path from 'path';

/**
 * Audit fields that should be placed at the end of CREATE TABLE statements
 * Order: createdAt, createdById, createdByName, updatedAt, updatedById, updatedByName
 */
const AUDIT_FIELDS = [
  'createdAt',
  'createdById',
  'createdByName',
  'updatedAt',
  'updatedById',
  'updatedByName',
];

/**
 * Extracts CREATE TABLE statement with proper handling of nested parentheses
 */
function extractCreateTable(
  content: string,
  startIndex: number,
): { fullMatch: string; tableName: string; columnsSection: string; endIndex: number } | null {
  const createTableMatch = content.substring(startIndex).match(/CREATE TABLE\s+"(\w+)"\s*\(/);
  if (!createTableMatch) return null;

  const tableName = createTableMatch[1];
  const tableStart = startIndex + createTableMatch.index!;
  const columnsStart = tableStart + createTableMatch[0].length;

  // Find the matching closing parenthesis by tracking depth
  let parenDepth = 1;
  let i = columnsStart;
  while (i < content.length && parenDepth > 0) {
    if (content[i] === '(') parenDepth++;
    if (content[i] === ')') parenDepth--;
    i++;
  }

  if (parenDepth !== 0) return null; // Unmatched parentheses

  const columnsSection = content.substring(columnsStart, i - 1);
  const fullMatch = content.substring(tableStart, i);

  return {
    fullMatch,
    tableName,
    columnsSection,
    endIndex: i,
  };
}

/**
 * Reorders columns in CREATE TABLE statements to place audit fields at the end
 */
function reorderMigrationFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  let modifiedContent = content;
  const matches: Array<{
    fullMatch: string;
    tableName: string;
    columnsSection: string;
  }> = [];

  // Collect all CREATE TABLE matches
  let searchIndex = 0;
  while (searchIndex < content.length) {
    const match = extractCreateTable(content, searchIndex);
    if (!match) break;

    matches.push({
      fullMatch: match.fullMatch,
      tableName: match.tableName,
      columnsSection: match.columnsSection,
    });

    searchIndex = match.endIndex;
  }

  // Process each match in reverse order to avoid index shifting
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, tableName, columnsSection } = matches[i];

    // Split columns by comma, but be careful with nested parentheses (constraints)
    const columns: string[] = [];
    let currentColumn = '';
    let parenDepth = 0;

    for (let j = 0; j < columnsSection.length; j++) {
      const char = columnsSection[j];
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        const trimmed = currentColumn.trim();
        if (trimmed) {
          columns.push(trimmed);
        }
        currentColumn = '';
      } else {
        currentColumn += char;
      }
    }
    const trimmed = currentColumn.trim();
    if (trimmed) {
      columns.push(trimmed);
    }

    // Separate audit fields from regular columns
    const regularColumns: string[] = [];
    const auditColumns: string[] = [];

    columns.forEach((col) => {
      const colNameMatch = col.match(/^"(\w+)"/);
      if (colNameMatch) {
        const colName = colNameMatch[1];
        // Check if it's an audit field (case-insensitive)
        const isAuditField = AUDIT_FIELDS.some(
          (auditField) => colName.toLowerCase() === auditField.toLowerCase(),
        );

        if (isAuditField) {
          auditColumns.push(col);
        } else {
          regularColumns.push(col);
        }
      } else {
        // Handle constraints (PRIMARY KEY, FOREIGN KEY, etc.)
        regularColumns.push(col);
      }
    });

    // Reorder: regular columns first, then audit fields
    // Sort audit fields in the correct order
    auditColumns.sort((a, b) => {
      const aName = a.match(/^"(\w+)"/)?.[1]?.toLowerCase() || '';
      const bName = b.match(/^"(\w+)"/)?.[1]?.toLowerCase() || '';
      const aIndex = AUDIT_FIELDS.findIndex((f) => f.toLowerCase() === aName);
      const bIndex = AUDIT_FIELDS.findIndex((f) => f.toLowerCase() === bName);
      return aIndex - bIndex;
    });

    const reorderedColumns = [...regularColumns, ...auditColumns];
    const newColumnsSection = reorderedColumns.join(', ');
    const newCreateTable = `CREATE TABLE "${tableName}" (${newColumnsSection})`;

    // Replace the original CREATE TABLE statement
    modifiedContent = modifiedContent.replace(fullMatch, newCreateTable);
  }

  // Write the modified content back to the file
  fs.writeFileSync(filePath, modifiedContent, 'utf-8');
  console.log(`✓ Reordered migration file: ${filePath}`);
}

// Usage: ts-node -r tsconfig-paths/register src/db/scripts/reorder-migration-file.ts <migration-file-path>
const migrationFilePath = process.argv[2];

if (!migrationFilePath) {
  console.error(
    'Usage: ts-node -r tsconfig-paths/register src/db/scripts/reorder-migration-file.ts <migration-file-path>',
  );
  process.exit(1);
}

const absolutePath = path.isAbsolute(migrationFilePath)
  ? migrationFilePath
  : path.resolve(process.cwd(), migrationFilePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`Error: File not found: ${absolutePath}`);
  process.exit(1);
}

reorderMigrationFile(absolutePath);
