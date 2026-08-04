import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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

const statusClass: Record<string, string> = {
  draft: 'text-slate-500',
  active: 'text-green-600',
  paused: 'text-amber-600',
  retired: 'text-slate-400',
};

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [monitoredTrigger, setMonitoredTrigger] = useState('');
  const [rules, setRules] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadAgents() {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<Agent[]>('/agents');
      setAgents(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load agents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function createAgent(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const agent = await apiFetch<Agent>('/agents', {
        method: 'POST',
        body: { name, monitoredTrigger, rules },
      });
      setAgents((prev) => [agent, ...prev]);
      setName('');
      setMonitoredTrigger('');
      setRules('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create agent.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold text-slate-900">Agents</h1>

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">New agent</h2>
        <form onSubmit={createAgent} className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Yield Watcher)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={monitoredTrigger}
            onChange={(e) => setMonitoredTrigger(e.target.value)}
            placeholder="What it monitors (e.g. USDC lending APY on Aave, Base chain)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Rules (e.g. If APY rises above 8%, deposit 100 USDC. Otherwise do nothing.)"
            required
            rows={2}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create agent'}
          </button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Your agents</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : agents.length === 0 ? (
          <p className="text-sm text-slate-500">No agents yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {agents.map((agent) => (
              <li key={agent.id}>
                <Link
                  to={`/agents/${agent.id}`}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-900">{agent.name}</div>
                    <div className="text-xs text-slate-500">{agent.monitoredTrigger}</div>
                  </div>
                  <span className={`text-xs font-medium ${statusClass[agent.status] ?? ''}`}>
                    {agent.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
