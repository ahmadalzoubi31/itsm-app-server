# LDAP Sync Settings API

This document describes the API endpoints for managing LDAP sync settings and scheduling.

## Endpoints

### 1. Get Sync Settings

**GET** `/ldap/sync-settings`

Returns the current sync settings configuration.

**Response:**

```json
{
  "enabled": true,
  "frequency": "DAILY",
  "syncTime": "02:00",
  "timezone": "UTC",
  "retryAttempts": 3,
  "retryInterval": 30,
  "fullSyncInterval": 7
}
```

### 2. Update Sync Settings

**PUT** `/ldap/sync-settings`

Updates the sync settings and automatically starts/stops the scheduler based on the enabled flag.

**Request Body:**

```json
{
  "enabled": true,
  "frequency": "DAILY",
  "syncTime": "02:00",
  "timezone": "UTC",
  "retryAttempts": 3,
  "retryInterval": 30,
  "fullSyncInterval": 7
}
```

**Response:**

```json
{
  "message": "Sync settings updated successfully",
  "settings": {
    "enabled": true,
    "frequency": "DAILY",
    "syncTime": "02:00",
    "timezone": "UTC",
    "retryAttempts": 3,
    "retryInterval": 30,
    "fullSyncInterval": 7
  }
}
```

### 3. Get Scheduler Status

**GET** `/ldap/scheduler-status`

Returns the current status of the LDAP sync scheduler.

**Response:**

```json
{
  "isRunning": true,
  "nextExecution": "2024-01-15T02:00:00.000Z",
  "isInitialized": true
}
```

## Frequency Options

- `HOURLY`: Runs every hour at the specified minute
- `DAILY`: Runs daily at the specified time
- `WEEKLY`: Runs weekly on Sunday at the specified time
- `MONTHLY`: Runs monthly on the 1st at the specified time

## Time Format

The `syncTime` should be in 24-hour format: `HH:MM` (e.g., "02:00" for 2 AM).

## Timezone

The `timezone` should be a valid IANA timezone identifier (e.g., "UTC", "America/New_York", "Europe/London").

## Retry Configuration

- `retryAttempts`: Number of retry attempts if sync fails (default: 3)
- `retryInterval`: Time in seconds between retry attempts (default: 30)

## Full Sync Interval

- `fullSyncInterval`: Number of days between full syncs (default: 7)

## How It Works

1. When sync settings are saved with `enabled: true`, the scheduler automatically starts
2. When sync settings are saved with `enabled: false`, the scheduler automatically stops
3. The scheduler uses cron expressions to determine when to run
4. If a sync fails, it will retry based on the retry configuration
5. The scheduler respects the timezone setting for execution times
6. The scheduler is automatically initialized when the application starts

## Example Usage

### Enable Daily Sync at 2 AM UTC

```bash
curl -X PUT http://localhost:3000/ldap/sync-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "frequency": "DAILY",
    "syncTime": "02:00",
    "timezone": "UTC",
    "retryAttempts": 3,
    "retryInterval": 30,
    "fullSyncInterval": 7
  }'
```

### Disable Sync

```bash
curl -X PUT http://localhost:3000/ldap/sync-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": false,
    "frequency": "DAILY",
    "syncTime": "02:00",
    "timezone": "UTC",
    "retryAttempts": 3,
    "retryInterval": 30,
    "fullSyncInterval": 7
  }'
```
