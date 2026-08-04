export const AGENT_REASONING = Symbol('AGENT_REASONING');

export interface ReasoningRequest {
  agentName: string;
  monitoredTrigger: string;
  rules: string;
  triggerContext: Record<string, unknown>;
  /** What the agent is actually allowed to do — the LLM is not asked to invent capabilities. */
  allowedActions: readonly string[];
}

export interface ReasoningResult {
  outcome: 'execute' | 'skip' | 'blocked';
  rationale: string;
  /** Only present when outcome is 'execute' — what to actually run. */
  action?: {
    kind: 'transfer' | 'protocol_action';
    params: Record<string, unknown>;
  };
}

/**
 * External-capability port (see docs/ARCHITECTURE.md §5.0) — only the
 * infrastructure adapter knows this is backed by Oxlo.ai via LangChain.
 */
export interface AgentReasoning {
  evaluate(request: ReasoningRequest): Promise<ReasoningResult>;
}
