import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch, ApiError } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { staggerContainer, staggerItem } from '../components/ui/PageTransition';
import { inputClass, labelClass } from '../lib/ui';

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
  allowedDestinations: string[];
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

export function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [policy, setPolicy] = useState<AgentPolicy | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [spendLimit, setSpendLimit] = useState('');
  const [allowedActions, setAllowedActions] = useState('');
  const [allowedDestinations, setAllowedDestinations] = useState('');
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
      setAllowedDestinations(policyResult.allowedDestinations.join(', '));
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
          allowedDestinations: allowedDestinations
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
  if (!agent) return <p className="text-sm text-red-400">{error ?? 'Agent not found.'}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/agents" className="text-xs text-slate-500 hover:text-slate-300">
            ← Agents
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">{agent.name}</h1>
          <p className="text-sm text-slate-400">{agent.monitoredTrigger}</p>
        </div>
        <Badge status={agent.status} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-white">Rules</h2>
        <p className="text-sm text-slate-300">{agent.rules}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="success"
            onClick={() => changeStatus('activate')}
            disabled={statusChanging || agent.status === 'active'}
            className="px-3 py-1.5 text-xs"
          >
            Activate
          </Button>
          <Button
            variant="warning"
            onClick={() => changeStatus('pause')}
            disabled={statusChanging || agent.status !== 'active'}
            className="px-3 py-1.5 text-xs"
          >
            Pause
          </Button>
          <Button
            variant="secondary"
            onClick={() => changeStatus('retire')}
            disabled={statusChanging || agent.status === 'retired'}
            className="px-3 py-1.5 text-xs"
          >
            Retire
          </Button>
          <Link
            to={`/wallet?agentId=${agent.id}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
          >
            View wallet
          </Link>
          <Link
            to={`/executions?agentId=${agent.id}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
          >
            View executions
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Policy</h2>
        {policy && (
          <form onSubmit={savePolicy} className="flex flex-col gap-3">
            <label className={labelClass}>
              Spend limit (cumulative total)
              <input
                value={spendLimit}
                onChange={(e) => setSpendLimit(e.target.value)}
                className={`w-40 ${inputClass}`}
              />
            </label>
            <label className={labelClass}>
              Allowed actions (comma-separated, e.g. transfer, protocol_action)
              <input
                value={allowedActions}
                onChange={(e) => setAllowedActions(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Allowed destination addresses (comma-separated, transfers only — leave empty for no
              restriction)
              <input
                value={allowedDestinations}
                onChange={(e) => setAllowedDestinations(e.target.value)}
                placeholder="0xabc…, 0xdef…"
                className={inputClass}
              />
            </label>
            <Button type="submit" disabled={savingPolicy} className="w-fit">
              {savingPolicy ? 'Saving…' : 'Save policy'}
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Evaluate now</h2>
        <p className="mb-3 text-xs text-slate-500">
          No live trigger system yet — paste the current state of what this agent monitors and it
          will reason over it via the LLM, same as a real trigger firing would.
        </p>
        <form onSubmit={evaluate} className="flex flex-col gap-3">
          <textarea
            value={triggerContext}
            onChange={(e) => setTriggerContext(e.target.value)}
            rows={4}
            className={`font-mono text-xs ${inputClass}`}
          />
          <Button type="submit" disabled={evaluating} className="w-fit">
            {evaluating ? 'Evaluating…' : 'Evaluate'}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Decision log</h2>
        {decisions.length === 0 ? (
          <p className="text-sm text-slate-500">No decisions yet.</p>
        ) : (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {decisions.map((decision) => (
              <motion.li key={decision.id} variants={staggerItem}>
                <Card className="p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge status={decision.outcome} />
                    <span className="text-xs text-slate-500">
                      {new Date(decision.evaluatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-300">{decision.rationale}</p>
                  {decision.resultingExecutionId && (
                    <Link
                      to={`/executions?agentId=${agent.id}`}
                      className="mt-1 inline-block text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      execution {decision.resultingExecutionId}
                    </Link>
                  )}
                </Card>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
