import { useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api-client';

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

const statusClass: Record<string, string> = {
  pending: 'text-slate-500',
  submitted: 'text-amber-600',
  confirmed: 'text-green-600',
  failed: 'text-red-600',
};

/**
 * Agents don't exist yet (Day 3) — lookup-by-id, same pattern as
 * WalletPage. Executes real on-chain transactions via KeeperHub, so this
 * screen deliberately was NOT click-tested with a live submission during
 * Day 2 build/verification (see ROADMAP.md) — the first real execution is
 * a deliberate Day 4 demo run, not an incidental one during frontend work.
 */
export function ExecutionsPage() {
  const [agentId, setAgentId] = useState('demo-agent-1');
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

  async function loadExecutions(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<Execution[]>(`/agents/${agentId}/executions`);
      setExecutions(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load executions.');
    } finally {
      setLoading(false);
    }
  }

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
      <h1 className="text-lg font-semibold text-slate-900">Executions</h1>

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">New transfer</h2>
        <p className="mb-3 text-xs text-amber-700">
          This submits a real on-chain transaction via KeeperHub and moves real funds from the
          linked wallet.
        </p>
        <form onSubmit={submitTransfer} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              placeholder="Chain ID (e.g. 8453 for Base)"
              className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (e.g. 0.001)"
              className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="Recipient address (0x...)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Token address (leave blank for native token)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I understand this moves real funds and cannot be undone.
          </label>
          <button
            type="submit"
            disabled={!confirmed || submitting}
            className="w-fit rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Submit transfer'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Agent execution history</h2>
        <form onSubmit={loadExecutions} className="mb-3 flex gap-2">
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Agent ID"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </form>

        {executions.length === 0 ? (
          <p className="text-sm text-slate-500">No executions yet.</p>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Tx hash</th>
                <th className="py-2 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr key={execution.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-500">
                    {new Date(execution.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{execution.kind}</td>
                  <td className={`py-2 pr-4 font-medium ${statusClass[execution.status] ?? ''}`}>
                    {execution.status}
                    {execution.failureReason && (
                      <span className="ml-2 text-xs text-slate-400">
                        {execution.failureReason}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {execution.transactionHash ?? '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {(execution.status === 'submitted' || execution.status === 'pending') && (
                      <button
                        onClick={() => refresh(execution.id)}
                        className="text-xs font-medium text-slate-600 underline"
                      >
                        Refresh
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Browse available protocol actions
        </h2>
        <form onSubmit={searchActions} className="mb-3 flex gap-2">
          <input
            value={protocolQuery}
            onChange={(e) => setProtocolQuery(e.target.value)}
            placeholder="Protocol (e.g. chronicle, aave-v3)"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Search
          </button>
        </form>
        {actions.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {actions.map((action) => (
              <li key={action.actionType} className="rounded-md border border-slate-200 p-3">
                <div className="font-mono text-xs text-slate-900">{action.actionType}</div>
                <div className="text-slate-500">{action.description}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
