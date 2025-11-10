# Reorder Migration File

This command reorders migration files to ensure audit fields are placed at the end of CREATE TABLE statements.

## Audit Fields Order

The following audit fields will be moved to the end of table definitions in this order:
1. `createdAt`
2. `createdById`
3. `createdByName`
4. `updatedAt`
5. `updatedById`
6. `updatedByName`

## Usage

Run the script with ts-node:

```bash
ts-node -r tsconfig-paths/register src/db/scripts/reorder-migration-file.ts <migration-file-path>
```

### Example

```bash
ts-node -r tsconfig-paths/register src/db/scripts/reorder-migration-file.ts src/db/1762413899812-migrations.ts
```

## Script Location

The script is located at: `src/db/scripts/reorder-migration-file.ts`

## How It Works

1. Parses all `CREATE TABLE` statements in the migration file
2. Identifies audit fields by matching column names against the audit field list
3. Separates regular columns from audit fields
4. Reorders columns: regular columns first, then audit fields (in the specified order)
5. Preserves constraints (PRIMARY KEY, FOREIGN KEY, etc.)
6. Writes the reordered content back to the file
