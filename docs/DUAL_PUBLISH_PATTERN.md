# Dual-Publish Pattern Architecture

## Overview

This application uses a **dual-publish pattern** to handle domain events with different processing requirements:

- **Synchronous in-process events** via `EventService` for immediate actions
- **Asynchronous outbox events** via `OutboxService` for eventual consistency

## Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Case Created Event                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  CaseService    │
                    │  .createCase()  │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌──────────────────────┐
    │ EventService.emit()   │   │ Outbox.enqueue()     │
    │ [SYNCHRONOUS]         │   │ [ASYNCHRONOUS]       │
    └───────────────────────┘   └──────────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌──────────────────────┐
    │ SlaModule             │   │ outbox_message table │
    │ - Starts SLA timer    │   │ (persisted)          │
    │ - Immediate action    │   └──────────────────────┘
    └───────────────────────┘               │
                                            ▼
                                ┌──────────────────────┐
                                │ OutboxWorker         │
                                │ (polls every 2s)     │
                                └──────────────────────┘
                                            │
                                            ▼
                                ┌──────────────────────┐
                                │ EventService.emit()  │
                                │ (from outbox)        │
                                └──────────────────────┘
                                            │
                                            ▼
                                ┌──────────────────────┐
                                │ NotifyWorker         │
                                │ - Sends email        │
                                │ - Eventual action    │
                                └──────────────────────┘
```

## Why Dual-Publish?

### Synchronous Events (EventService)
**Use for:** Actions that must happen immediately and can fail fast
- **SLA timer start** - Must start immediately when case is created
- **In-memory state updates** - Cache invalidation, metrics
- **Fast validations** - Business rule checks

**Characteristics:**
- Executes in the same transaction/request context
- Failures bubble up to the caller
- No retry mechanism
- Low latency

### Asynchronous Events (Outbox)
**Use for:** Actions that can be eventually consistent and need reliability
- **Email notifications** - Can be delayed, need retry on failure
- **External API calls** - Third-party integrations
- **Heavy processing** - Report generation, analytics
- **Cross-service communication** - Microservices events

**Characteristics:**
- Persisted in database (transactional outbox pattern)
- Processed asynchronously by OutboxWorker
- Automatic retry on failure
- Guaranteed delivery (at-least-once)

## Implementation Details

### 1. CaseService (Publisher)

```typescript
async createCase(dto: CreateCaseDto) {
  const saved = await this.cases.save(entity);

  // DUAL-PUBLISH:
  // 1. Sync event for immediate handlers (SLA)
  await this.eventService.emit({
    type: 'case.created',
    payload: saved,
  });

  // 2. Async outbox for eventual handlers (email)
  await this.outbox.enqueue({
    type: 'case.created',
    payload: saved,
    aggregateType: 'Case',
    aggregateId: saved.id,
  });

  return saved;
}
```

### 2. SlaModule (Sync Subscriber)

```typescript
export class SlaModule {
  constructor(
    private readonly eventService: EventService,
    private readonly slaSvc: SlaService,
  ) {
    // Register sync handler
    this.eventService.on('case.created', this.handleCaseCreated.bind(this));
  }

  private async handleCaseCreated(event: { type: 'case.created'; payload: Case }) {
    // Starts SLA timer immediately
    await this.slaSvc.initForCase({
      id: event.payload.id,
      businessLineId: event.payload.businessLineId,
    });
  }
}
```

### 3. OutboxWorker (Async Processor)

```typescript
export class OutboxWorker {
  private async tick(batchSize: number) {
    const batch = await this.outbox.fetchBatch(batchSize);
    
    for (const msg of batch) {
      // Emit to EventService for async handlers
      await this.eventService.emit({
        type: msg.type,
        payload: msg.payload,
      });
      
      await this.outbox.markSuccess(msg.id);
    }
  }
}
```

### 4. NotifyWorker (Async Subscriber)

```typescript
export class NotifyWorker implements OnModuleInit {
  onModuleInit() {
    // Register async handlers (triggered by OutboxWorker)
    this.eventService.on('case.created', this.handleCaseCreated.bind(this));
  }

  private async handleCaseCreated(event: { type: 'case.created'; payload: Case }) {
    // Send email notification (can be delayed, retried)
    const requester = await this.users.findOneBy({ id: event.payload.requesterId });
    await this.email.sendForBL(/* ... */);
  }
}
```

## Event Types

### Case Events
- `case.created` - Sync: SLA start | Async: Email to requester
- `case.assigned` - Sync: N/A | Async: Email to assignee
- `case.status.changed` - Sync: SLA stop | Async: Email to requester
- `case.comment.added` - Sync: N/A | Async: Email to watchers
- `case.attachment.added` - Sync: N/A | Async: Email notification

### SLA Events
- `sla.breached` - Sync: N/A | Async: Email to assignee/manager

## Configuration

### Environment Variables
```env
# Outbox polling configuration
OUTBOX_POLL_MS=2000    # Poll interval in milliseconds
OUTBOX_BATCH=50        # Batch size per poll
```

## Benefits

1. **Separation of Concerns**
   - Immediate actions don't wait for slow operations
   - Email failures don't break case creation

2. **Reliability**
   - Outbox pattern ensures events aren't lost
   - Automatic retry for failed async operations

3. **Performance**
   - User requests return quickly
   - Heavy operations processed in background

4. **Flexibility**
   - Easy to add new sync or async handlers
   - Can route same event to multiple handlers

## Trade-offs

### Eventual Consistency
- Email notifications may be delayed
- Outbox messages processed every 2 seconds (configurable)

### Duplicate Events
- Same event type emitted twice (sync + async)
- Handlers must be idempotent or check event source

### Complexity
- Two event emission paths to maintain
- Need to decide sync vs async for each handler

## Best Practices

1. **Choose the Right Path**
   - Sync: Critical business logic, fast operations
   - Async: External calls, notifications, heavy processing

2. **Idempotent Handlers**
   - Async handlers may be retried
   - Use deduplication (e.g., `processedCases` Set in NotifyWorker)

3. **Error Handling**
   - Sync: Let errors bubble up
   - Async: Log and continue (don't throw)

4. **Monitoring**
   - Track outbox message age
   - Alert on high failure rates
   - Monitor email delivery

## Future Enhancements

- [ ] Add dead letter queue for failed outbox messages
- [ ] Implement exponential backoff for retries
- [ ] Add event versioning for schema evolution
- [ ] Support external message brokers (Kafka, RabbitMQ)
- [ ] Add event replay capability
