# Centralized Error Handling

This application uses a centralized error handling system to provide consistent error responses across all endpoints.

## Global Exception Filter

The `GlobalExceptionFilter` is registered globally in `main.ts` and handles all exceptions thrown by the application, converting them to appropriate HTTP responses.

### Error Response Format

All error responses follow this consistent format:

```json
{
  "statusCode": 409,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/iam/groups",
  "method": "POST",
  "message": "Group key already exists",
  "error": "Conflict"
}
```

### Handled Error Types

#### 1. Database Constraint Violations

The filter automatically handles PostgreSQL constraint violations:

- **Unique Constraint (23505)**: Returns `409 Conflict`

  - Username already exists
  - Group key already exists
  - Service key already exists
  - Business line key already exists
  - User already member of group
  - Case number already exists

- **Foreign Key Constraint (23503)**: Returns `400 Bad Request`

  - Referenced resource does not exist

- **Not Null Constraint (23502)**: Returns `400 Bad Request`

  - Required field cannot be null

- **Check Constraint (23514)**: Returns `400 Bad Request`
  - Invalid data provided

#### 2. NestJS HTTP Exceptions

All NestJS built-in exceptions are handled:

- `BadRequestException` → 400 Bad Request
- `UnauthorizedException` → 401 Unauthorized
- `ForbiddenException` → 403 Forbidden
- `NotFoundException` → 404 Not Found
- `ConflictException` → 409 Conflict
- `UnprocessableEntityException` → 422 Unprocessable Entity

#### 3. Validation Errors

- `ValidationError` → 400 Bad Request
- `CastError` → 400 Bad Request

## Benefits

1. **Consistent Error Format**: All errors follow the same response structure
2. **Automatic Constraint Handling**: No need to manually check for duplicates in services
3. **Proper HTTP Status Codes**: Database errors are converted to appropriate HTTP status codes
4. **User-Friendly Messages**: Technical database errors are converted to readable messages
5. **Centralized Logging**: All errors are logged consistently

## Usage in Services

Services no longer need to manually handle unique constraint violations. Simply save the entity and let the global filter handle any conflicts:

```typescript
// Before (manual handling)
async createUser(dto: CreateUserDto) {
  const existing = await this.users.findOne({ where: { username: dto.username } });
  if (existing) {
    throw new ConflictException(`Username "${dto.username}" already exists`);
  }
  return this.users.save(user);
}

// After (automatic handling)
async createUser(dto: CreateUserDto) {
  const user = this.users.create(dto);
  return this.users.save(user); // Global filter handles conflicts
}
```

## Custom Error Messages

The filter includes specific error messages for known constraints:

- `UQ_user_username` → "Username already exists"
- `UQ_group_key` → "Group key already exists"
- `UQ_service_key` → "Service key already exists"
- `UQ_business_line_key` → "Business line key already exists"
- `UQ_membership_groupId_userId` → "User is already a member of this group"

For unknown constraints, it generates generic messages based on the table and column names.
