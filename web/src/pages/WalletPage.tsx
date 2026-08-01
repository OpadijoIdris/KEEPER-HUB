import { useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api-client';

interface AgentWallet {
  agentId: string;
  address: string;
  keeperHubIntegrationId: string;
  linkedAt: string;
}

interface PaymentAuthorization {
  id: string;
  amount: string;
  asset: string;
  status: string;
  reason: string | null;
  decidedAt: string;
}

/**
 * Agents don't exist yet (Day 3, ROADMAP.md) — this is a lookup-by-id page
 * for now rather than a list tied to "your agents", matching what the
 * backend actually supports today. Becomes an agent-scoped view once F7
 * (Agent list/detail) lands.
 */
export function WalletPage() {
  const [agentId, setAgentId] = useState('demo-agent-1');
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [authorizations, setAuthorizations] = useState<PaymentAuthorization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const [walletResult, authResult] = await Promise.all([
        apiFetch<AgentWallet>(`/agents/${agentId}/wallet`),
        apiFetch<PaymentAuthorization[]>(`/agents/${agentId}/wallet/authorizations`),
      ]);
      setWallet(walletResult);
      setAuthorizations(authResult);
    } catch (err) {
      setWallet(null);
      setError(err instanceof ApiError ? err.message : 'Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-slate-900">Wallet</h1>

      <form onSubmit={lookup} className="flex gap-2">
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
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {wallet && (
        <section className="flex flex-col gap-2 rounded-md border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Linked KeeperHub wallet</div>
          <div className="font-mono text-sm text-slate-900">{wallet.address}</div>
          <div className="text-xs text-slate-400">
            integration {wallet.keeperHubIntegrationId} · linked{' '}
            {new Date(wallet.linkedAt).toLocaleString()}
          </div>
        </section>
      )}

      {wallet && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment authorizations</h2>
          {authorizations.length === 0 ? (
            <p className="text-sm text-slate-500">None yet.</p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Decided</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {authorizations.map((auth) => (
                  <tr key={auth.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(auth.decidedAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      {auth.amount} {auth.asset}
                    </td>
                    <td className="py-2 pr-4">{auth.status}</td>
                    <td className="py-2 pr-4 text-slate-500">{auth.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
