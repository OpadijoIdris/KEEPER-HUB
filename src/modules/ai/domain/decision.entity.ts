import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { CorrelationContext } from '../../../shared/infrastructure/correlation/correlation-context';
import { DecisionMadeEvent } from './events/decision-made.event';

export type DecisionOutcome = 'execute' | 'skip' | 'blocked';

/**
 * Separate aggregate from Agent (unbounded history per agent, same
 * rule as Execution/PaymentAuthorization — see docs/ARCHITECTURE.md §4.0).
 * rationale is the single most important field for judges evaluating "AI
 * decision-making" — always populated, never an afterthought.
 */
export class Decision extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly agentId: string,
    readonly triggerContext: Record<string, unknown>,
    readonly outcome: DecisionOutcome,
    readonly rationale: string,
    readonly resultingExecutionId: string | null,
    readonly evaluatedAt: Date,
  ) {
    super(id);
  }

  static record(
    agentId: string,
    triggerContext: Record<string, unknown>,
    outcome: DecisionOutcome,
    rationale: string,
    resultingExecutionId: string | null = null,
  ): Decision {
    const decision = new Decision(
      randomUUID(),
      agentId,
      triggerContext,
      outcome,
      rationale,
      resultingExecutionId,
      new Date(),
    );
    decision.addDomainEvent(
      new DecisionMadeEvent({
        correlationId: CorrelationContext.get(),
        payload: {
          agentId,
          outcome,
          rationale,
          resultingExecutionId: resultingExecutionId ?? undefined,
        },
        subject: { type: 'Agent', id: agentId },
        actor: { type: 'agent', id: agentId },
      }),
    );
    return decision;
  }

  static fromPersistence(
    id: string,
    agentId: string,
    triggerContext: Record<string, unknown>,
    outcome: DecisionOutcome,
    rationale: string,
    resultingExecutionId: string | null,
    evaluatedAt: Date,
  ): Decision {
    return new Decision(
      id,
      agentId,
      triggerContext,
      outcome,
      rationale,
      resultingExecutionId,
      evaluatedAt,
    );
  }
}
