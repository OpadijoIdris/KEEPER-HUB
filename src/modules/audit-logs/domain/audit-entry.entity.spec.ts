import { AuditEntry } from './audit-entry.entity';

describe('AuditEntry', () => {
  it('record() generates a fresh id and preserves all supplied fields', () => {
    const occurredAt = new Date('2026-01-01T00:00:00Z');
    const entry = AuditEntry.record({
      correlationId: 'corr-1',
      occurredAt,
      eventType: 'identity.user.registered',
      schemaVersion: 1,
      subject: { type: 'User', id: 'user-1' },
      actor: { type: 'system', id: 'system' },
      severity: 'info',
      payload: { userId: 'user-1', email: 'a@example.com' },
    });

    expect(entry.id).toBeTruthy();
    expect(entry.correlationId).toBe('corr-1');
    expect(entry.occurredAt).toBe(occurredAt);
    expect(entry.eventType).toBe('identity.user.registered');
    expect(entry.subject).toEqual({ type: 'User', id: 'user-1' });
    expect(entry.severity).toBe('info');
  });

  it('exposes no update or delete capability — append-only by construction', () => {
    const entry = AuditEntry.record({
      correlationId: 'corr-1',
      occurredAt: new Date(),
      eventType: 'x',
      schemaVersion: 1,
      subject: { type: 'User', id: 'user-1' },
      actor: { type: 'system', id: 'system' },
      severity: 'info',
      payload: {},
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(typeof (entry as any).update).toBe('undefined');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(typeof (entry as any).delete).toBe('undefined');
  });
});
