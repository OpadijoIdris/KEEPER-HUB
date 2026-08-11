import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch, ApiError } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { staggerContainer, staggerItem } from '../components/ui/PageTransition';
import { inputClass } from '../lib/ui';

interface Agent {
  id: string;
  ownerId: string;
  name: string;
  monitoredTrigger: string;
  rules: string;
  status: string;
  createdAt: string;
}

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
      <h1 className="text-xl font-bold tracking-tight text-white">Agents</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">New agent</h2>
        <form onSubmit={createAgent} className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Yield Watcher)"
            required
            className={inputClass}
          />
          <input
            value={monitoredTrigger}
            onChange={(e) => setMonitoredTrigger(e.target.value)}
            placeholder="What it monitors (e.g. USDC lending APY on Aave, Base chain)"
            required
            className={inputClass}
          />
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Rules (e.g. If APY rises above 8%, deposit 100 USDC. Otherwise do nothing.)"
            required
            rows={2}
            className={inputClass}
          />
          <Button type="submit" disabled={creating} className="w-fit">
            {creating ? 'Creating…' : 'Create agent'}
          </Button>
        </form>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Your agents</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : agents.length === 0 ? (
          <p className="text-sm text-slate-500">No agents yet.</p>
        ) : (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {agents.map((agent) => (
              <motion.li key={agent.id} variants={staggerItem}>
                <Link to={`/agents/${agent.id}`}>
                  <Card hover className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-medium text-white">{agent.name}</div>
                      <div className="text-xs text-slate-400">{agent.monitoredTrigger}</div>
                    </div>
                    <Badge status={agent.status} />
                  </Card>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
