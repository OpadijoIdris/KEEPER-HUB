import { InProcessEventBus } from './event-bus.module';
import { DomainEvent } from '../domain/domain-event.base';

interface TestPayload extends Record<string, unknown> {
  foo: string;
}

class TestEvent extends DomainEvent<TestPayload> {
  readonly eventType = 'test.thing.happened';
  readonly schemaVersion = 1;
}

function makeEvent(): TestEvent {
  return new TestEvent({
    correlationId: 'corr-1',
    payload: { foo: 'bar' },
    subject: { type: 'Thing', id: 'thing-1' },
  });
}

describe('InProcessEventBus', () => {
  it('delivers to a type-specific subscriber', async () => {
    const bus = new InProcessEventBus();
    const received: TestEvent[] = [];
    bus.subscribe('test.thing.happened', (e) => {
      received.push(e as TestEvent);
    });

    await bus.publish(makeEvent());

    expect(received).toHaveLength(1);
  });

  it('does not deliver to a subscriber of a different event type', async () => {
    const bus = new InProcessEventBus();
    const received: TestEvent[] = [];
    bus.subscribe('some.other.type', (e) => {
      received.push(e as TestEvent);
    });

    await bus.publish(makeEvent());

    expect(received).toHaveLength(0);
  });

  it('subscribeToAll receives every event regardless of type', async () => {
    const bus = new InProcessEventBus();
    const received: TestEvent[] = [];
    bus.subscribeToAll((e) => {
      received.push(e as TestEvent);
    });

    await bus.publish(makeEvent());

    expect(received).toHaveLength(1);
  });

  it('a throwing handler is caught as a dead letter and does not stop other handlers', async () => {
    const bus = new InProcessEventBus();
    const received: TestEvent[] = [];

    bus.subscribeToAll(() => {
      throw new Error('boom');
    });
    bus.subscribeToAll((e) => {
      received.push(e as TestEvent);
    });

    await expect(bus.publish(makeEvent())).resolves.toBeUndefined();
    expect(received).toHaveLength(1);
    expect(bus.getDeadLetters()).toHaveLength(1);
  });
});
