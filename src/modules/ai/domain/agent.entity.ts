import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { CorrelationContext } from '../../../shared/infrastructure/correlation/correlation-context';
import { AgentCreatedEvent } from './events/agent-created.event';

export type AgentStatus = 'draft' | 'active' | 'paused' | 'retired';

/**
 * No live trigger system (cron/event watching) — monitoredTrigger and
 * rules are descriptive text the AI reads as context when evaluated
 * on-demand via POST /agents/:id/evaluate (see ROADMAP.md Day 3 design
 * note). A real trigger system is future work, not this sprint's scope.
 */
export class Agent extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly ownerId: string,
    private _name: string,
    private _monitoredTrigger: string,
    private _rules: string,
    private _status: AgentStatus,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  get name(): string {
    return this._name;
  }

  get monitoredTrigger(): string {
    return this._monitoredTrigger;
  }

  get rules(): string {
    return this._rules;
  }

  get status(): AgentStatus {
    return this._status;
  }

  static create(ownerId: string, name: string, monitoredTrigger: string, rules: string): Agent {
    const agent = new Agent(
      randomUUID(),
      ownerId,
      name,
      monitoredTrigger,
      rules,
      'draft',
      new Date(),
    );
    agent.addDomainEvent(
      new AgentCreatedEvent({
        correlationId: CorrelationContext.get(),
        payload: { ownerId, name },
        subject: { type: 'Agent', id: agent.id },
        actor: { type: 'user', id: ownerId },
      }),
    );
    return agent;
  }

  static fromPersistence(
    id: string,
    ownerId: string,
    name: string,
    monitoredTrigger: string,
    rules: string,
    status: AgentStatus,
    createdAt: Date,
  ): Agent {
    return new Agent(id, ownerId, name, monitoredTrigger, rules, status, createdAt);
  }

  activate(): void {
    this._status = 'active';
  }

  pause(): void {
    this._status = 'paused';
  }

  retire(): void {
    this._status = 'retired';
  }
}
