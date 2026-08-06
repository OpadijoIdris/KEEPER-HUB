import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api-client';

interface Agent {
  id: string;
  ownerId: string;
  name: string;
  monitoredTrigger: string;
  rules: string;
  status: string;
  createdAt: string;
}

interface AgentPolicy {
  agentId: string;
  spendLimit: string;
  allowedActions: string[];
}

interface Decision {
  id: string;
  agentId: string;
  triggerContext: Record<string, unknown>;
  outcome: string;
  rationale: string;
  resultingExecutionId: string | null;
  evaluatedAt: string;
}

const statusClass: Record<string, string> = {
  draft: 'text-slate-500',
  active: 'text-green-600',
  paused: 'text-amber-600',
  retired: 'text-slate-400',
};

const outcomeClass: Record<string, string> = {
  execute: 'text-green-600',
  skip: 'text-slate-500',
  blocked: 'text-red-600',
};

export function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [policy, setPolicy] = useState<AgentPolicy | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [spendLimit, setSpendLimit] = useState('');
  const [allowedActions, setAllowedActions] = useState('');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [triggerContext, setTriggerContext] = useState('{\n  "currentApy": "5.2%"\n}');
  const [evaluating, setEvaluating] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  async function loadAll() {
    if (!agentId) return;
    setError(null);
    setLoading(true);
    try {
      const [agentResult, policyResult, decisionsResult] = await Promise.all([
        apiFetch<Agent>(`/agents/${agentId}`),
        apiFetch<AgentPolicy>(`/agents/${agentId}/policy`),
        apiFetch<Decision[]>(`/agents/${agentId}/decisions`),
      ]);
      setAgent(agentResult);
      setPolicy(policyResult);
      setSpendLimit(policyResult.spendLimit);
      setAllowedActions(policyResult.allowedActions.join(', '));
      setDecisions(decisionsResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load agent.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  async function changeStatus(action: 'activate' | 'pause' | 'retire') {
    if (!agentId) return;
    setError(null);
    setStatusChanging(true);
    try {
      const updated = await apiFetch<Agent>(`/agents/${agentId}/${action}`, { method: 'POST' });
      setAgent(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} agent.`);
    } finally {
      setStatusChanging(false);
    }
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    if (!agentId) return;
    setError(null);
    setSavingPolicy(true);
    try {
      const updated = await apiFetch<AgentPolicy>(`/agents/${agentId}/policy`, {
        method: 'PATCH',
        body: {
          spendLimit,
          allowedActions: allowedActions
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
        },
      });
      setPolicy(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update policy.');
    } finally {
      setSavingPolicy(false);
    }
  }

  async function evaluate(event: FormEvent) {
    event.preventDefault();
    if (!agentId) return;
    setError(null);
    setEvaluating(true);
    try {
      const parsed = JSON.parse(triggerContext);
      const decision = await apiFetch<Decision>(`/agents/${agentId}/evaluate`, {
        method: 'POST',
        body: { triggerContext: parsed },
      });
      setDecisions((prev) => [decision, ...prev]);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Trigger context must be valid JSON.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to evaluate agent.');
      }
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!agent) return <p className="text-sm text-red-600">{error ?? 'Agent not found.'}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/agents" className="text-xs text-slate-500 hover:underline">
            ← Agents
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{agent.name}</h1>
          <p className="text-sm text-slate-500">{agent.monitoredTrigger}</p>
        </div>
        <span className={`text-sm font-medium ${statusClass[agent.status] ?? ''}`}>
          {agent.status}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Rules</h2>
        <p className="text-sm text-slate-700">{agent.rules}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => changeStatus('activate')}
            disabled={statusChanging || agent.status === 'active'}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Activate
          </button>
          <button
            onClick={() => changeStatus('pause')}
            disabled={statusChanging || agent.status !== 'active'}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Pause
          </button>
          <button
            onClick={() => changeStatus('retire')}
            disabled={statusChanging || agent.status === 'retired'}
            className="rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Retire
          </button>
          <Link
            to={`/wallet?agentId=${agent.id}`}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 underline"
          >
            View wallet
          </Link>
          <Link
            to={`/executions?agentId=${agent.id}`}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 underline"
          >
            View executions
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Policy</h2>
        {policy && (
          <form onSubmit={savePolicy} className="flex flex-col gap-2">
            <label className="text-xs text-slate-500">
              Spend limit (cumulative total)
              <input
                value={spendLimit}
                onChange={(e) => setSpendLimit(e.target.value)}
                className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              Allowed actions (comma-separated, e.g. transfer, protocol_action)
              <input
                value={allowedActions}
                onChange={(e) => setAllowedActions(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={savingPolicy}
              className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingPolicy ? 'Saving…' : 'Save policy'}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Evaluate now</h2>
        <p className="mb-3 text-xs text-slate-500">
          No live trigger system yet — paste the current state of what this agent monitors and it
          will reason over it via the LLM, same as a real trigger firing would.
        </p>
        <form onSubmit={evaluate} className="flex flex-col gap-2">
          <textarea
            value={triggerContext}
            onChange={(e) => setTriggerContext(e.target.value)}
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={evaluating}
            className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {evaluating ? 'Evaluating…' : 'Evaluate'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Decision log</h2>
        {decisions.length === 0 ? (
          <p className="text-sm text-slate-500">No decisions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {decisions.map((decision) => (
              <li key={decision.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${outcomeClass[decision.outcome] ?? ''}`}>
                    {decision.outcome}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(decision.evaluatedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-slate-700">{decision.rationale}</p>
                {decision.resultingExecutionId && (
                  <Link
                    to={`/executions?agentId=${agent.id}`}
                    className="mt-1 inline-block text-xs text-slate-500 underline"
                  >
                    execution {decision.resultingExecutionId}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
