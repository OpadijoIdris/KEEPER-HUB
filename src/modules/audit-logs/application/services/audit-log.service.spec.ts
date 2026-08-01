import { AuditLogService } from './audit-log.service';
import { AuditEntry } from '../../domain/audit-entry.entity';
import type {
  AuditEntryRepository,
  AuditQueryFilter,
} from '../../domain/ports/audit-entry.repository';
import type { PaginatedResult } from '../../../../shared/application/pagination';
import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface TestPayload extends Record<string, unknown> {
  foo: string;
}

class TestEvent extends DomainEvent<TestPayload> {
  readonly eventType = 'test.thing.happened';
  readonly schemaVersion = 1;
}

class FakeAuditEntryRepository implements AuditEntryRepository {
  readonly entries: AuditEntry[] = [];

  async append(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  async findByCorrelationId(correlationId: string): Promise<AuditEntry[]> {
    return this.entries.filter((e) => e.correlationId === correlationId);
  }

  async query(
    filter: AuditQueryFilter,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AuditEntry>> {
    const filtered = this.entries.filter((e) => {
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      if (filter.subjectId && e.subject.id !== filter.subjectId) return false;
      return true;
    });
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
  }
}

describe('AuditLogService', () => {
  it('record() persists an AuditEntry derived from the given event', async () => {
    const repository = new FakeAuditEntryRepository();
    const service = new AuditLogService(repository);

    const event = new TestEvent({
      correlationId: 'corr-1',
      payload: { foo: 'bar' },
      subject: { type: 'Thing', id: 'thing-1' },
    });

    await service.record(event);

    expect(repository.entries).toHaveLength(1);
    expect(repository.entries[0].eventType).toBe('test.thing.happened');
    expect(repository.entries[0].subject).toEqual({ type: 'Thing', id: 'thing-1' });
    expect(repository.entries[0].actor).toEqual({ type: 'system', id: 'system' });
    expect(repository.entries[0].payload).toEqual({ foo: 'bar' });
  });

  it('query() filters and paginates', async () => {
    const repository = new FakeAuditEntryRepository();
    const service = new AuditLogService(repository);

    for (let i = 0; i < 3; i++) {
      await service.record(
        new TestEvent({
          correlationId: `corr-${i}`,
          payload: { foo: String(i) },
          subject: { type: 'Thing', id: 'thing-1' },
        }),
      );
    }

    const result = await service.query({ subjectId: 'thing-1' }, 1, 2);
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
  });

  it('findByCorrelationId returns only matching entries', async () => {
    const repository = new FakeAuditEntryRepository();
    const service = new AuditLogService(repository);

    await service.record(
      new TestEvent({
        correlationId: 'corr-a',
        payload: { foo: '1' },
        subject: { type: 'Thing', id: '1' },
      }),
    );
    await service.record(
      new TestEvent({
        correlationId: 'corr-b',
        payload: { foo: '2' },
        subject: { type: 'Thing', id: '2' },
      }),
    );

    const results = await service.findByCorrelationId('corr-a');
    expect(results).toHaveLength(1);
    expect(results[0].payload).toEqual({ foo: '1' });
  });
});
