import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { inputClass } from '../lib/ui';

interface Execution {
  id: string;
  agentId: string;
  kind: string;
  params: Record<string, unknown>;
  status: string;
  keeperHubExecutionId: string | null;
  transactionHash: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface ProtocolAction {
  actionType: string;
  protocol: string;
  description: string;
}

/**
 * Lookup-by-id, same pattern as WalletPage — AgentDetailPage (F7) links
 * here with ?agentId= prefilled. Executes real on-chain transactions via
 * KeeperHub, so this screen deliberately was NOT click-tested with a live
 * submission during Day 2 build/verification (see ROADMAP.md) — the first
 * real execution is a deliberate Day 4 demo run, not an incidental one
 * during frontend work.
 */
export function ExecutionsPage() {
  const [searchParams] = useSearchParams();
  const [agentId, setAgentId] = useState(searchParams.get('agentId') ?? '');
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [actions, setActions] = useState<ProtocolAction[]>([]);
  const [protocolQuery, setProtocolQuery] = useState('chronicle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [chainId, setChainId] = useState('8453');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadExecutionsForId(id: string) {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<Execution[]>(`/agents/${id}/executions`);
      setExecutions(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load executions.');
    } finally {
      setLoading(false);
    }
  }

  function loadExecutions(event: FormEvent) {
    event.preventDefault();
    loadExecutionsForId(agentId);
  }

  useEffect(() => {
    if (searchParams.get('agentId')) loadExecutionsForId(agentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchActions(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await apiFetch<ProtocolAction[]>(
        `/protocol-actions?protocol=${encodeURIComponent(protocolQuery)}`,
      );
      setActions(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to search protocol actions.');
    }
  }

  async function refresh(executionId: string) {
    try {
      const updated = await apiFetch<Execution>(`/executions/${executionId}/refresh`, {
        method: 'POST',
      });
      setExecutions((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to refresh status.');
    }
  }

  async function submitTransfer(event: FormEvent) {
    event.preventDefault();
    if (!confirmed) return;
    setError(null);
    setSubmitting(true);
    try {
      const execution = await apiFetch<Execution>(`/agents/${agentId}/executions/transfer`, {
        method: 'POST',
        body: {
          chainId,
          toAddress,
          amount,
          tokenAddress: tokenAddress || undefined,
        },
      });
      setExecutions((prev) => [execution, ...prev]);
      setConfirmed(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit transfer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold tracking-tight text-white">Executions</h1>

      <Card className="border-amber-500/30 bg-amber-500/[0.04]">
        <h2 className="mb-3 text-sm font-semibold text-white">New transfer</h2>
        <p className="mb-3 text-xs text-amber-400/90">
          This submits a real on-chain transaction via KeeperHub and moves real funds from the
          linked wallet.
        </p>
        <form onSubmit={submitTransfer} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              placeholder="Chain ID (e.g. 8453 for Base)"
              className={`w-56 ${inputClass}`}
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (e.g. 0.001)"
              className={`w-40 ${inputClass}`}
            />
          </div>
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="Recipient address (0x...)"
            className={inputClass}
          />
          <input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Token address (leave blank for native token)"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-400"
            />
            I understand this moves real funds and cannot be undone.
          </label>
          <Button type="submit" variant="warning" disabled={!confirmed || submitting} className="w-fit">
            {submitting ? 'Submitting…' : 'Submit transfer'}
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Agent execution history</h2>
        <form onSubmit={loadExecutions} className="mb-3 flex gap-2">
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Agent ID"
            className={`w-64 ${inputClass}`}
          />
          <Button type="submit" variant="secondary" disabled={loading}>
            {loading ? 'Loading…' : 'Load'}
          </Button>
        </form>

        {executions.length === 0 ? (
          <p className="text-sm text-slate-500">No executions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-2 pl-4 pr-4 font-medium">Created</th>
                  <th className="py-2 pr-4 font-medium">Kind</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Tx hash</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => (
                  <tr key={execution.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40">
                    <td className="py-2 pl-4 pr-4 text-slate-500">
                      {new Date(execution.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-slate-200">{execution.kind}</td>
                    <td className="py-2 pr-4">
                      <Badge status={execution.status} />
                      {execution.failureReason && (
                        <span className="ml-2 text-xs text-slate-500">{execution.failureReason}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-400">
                      {execution.transactionHash ?? '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {(execution.status === 'submitted' || execution.status === 'pending') && (
                        <button
                          onClick={() => refresh(execution.id)}
                          className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                        >
                          Refresh
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Browse available protocol actions</h2>
        <form onSubmit={searchActions} className="mb-3 flex gap-2">
          <input
            value={protocolQuery}
            onChange={(e) => setProtocolQuery(e.target.value)}
            placeholder="Protocol (e.g. chronicle, aave-v3)"
            className={`w-64 ${inputClass}`}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        {actions.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {actions.map((action) => (
              <li key={action.actionType}>
                <Card className="p-3">
                  <div className="font-mono text-xs text-white">{action.actionType}</div>
                  <div className="text-slate-400">{action.description}</div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
