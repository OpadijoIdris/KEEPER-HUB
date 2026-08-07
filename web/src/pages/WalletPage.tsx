import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
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
 * Still a lookup-by-id page rather than a nav item scoped to one agent —
 * there's no per-agent wallet sub-route. AgentDetailPage (F7) links here
 * with ?agentId= prefilled instead.
 */
export function WalletPage() {
  const [searchParams] = useSearchParams();
  const [agentId, setAgentId] = useState(searchParams.get('agentId') ?? '');
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [authorizations, setAuthorizations] = useState<PaymentAuthorization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(false);

  const [linkAddress, setLinkAddress] = useState('');
  const [linkIntegrationId, setLinkIntegrationId] = useState('');
  const [linking, setLinking] = useState(false);

  async function lookupId(id: string) {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const walletResult = await apiFetch<AgentWallet>(`/agents/${id}/wallet`);
      setWallet(walletResult);
      setLinkAddress(walletResult.address);
      setLinkIntegrationId(walletResult.keeperHubIntegrationId);
      const authResult = await apiFetch<PaymentAuthorization[]>(`/agents/${id}/wallet/authorizations`);
      setAuthorizations(authResult);
    } catch (err) {
      setWallet(null);
      setAuthorizations([]);
      // A 404 here just means "not linked yet" — not an error state, the link form below handles it.
      if (!(err instanceof ApiError && err.status === 404)) {
        setError(err instanceof ApiError ? err.message : 'Failed to load wallet.');
      }
    } finally {
      setLoading(false);
      setLooked(true);
    }
  }

  function lookup(event: FormEvent) {
    event.preventDefault();
    lookupId(agentId);
  }

  useEffect(() => {
    if (searchParams.get('agentId')) lookupId(agentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function linkWallet(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLinking(true);
    try {
      const walletResult = await apiFetch<AgentWallet>(`/agents/${agentId}/wallet`, {
        method: 'PATCH',
        body: { address: linkAddress, keeperHubIntegrationId: linkIntegrationId },
      });
      setWallet(walletResult);
      const authResult = await apiFetch<PaymentAuthorization[]>(`/agents/${agentId}/wallet/authorizations`);
      setAuthorizations(authResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to link wallet.');
    } finally {
      setLinking(false);
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

      {looked && agentId && (
        <section className="rounded-md border border-slate-200 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            {wallet ? 'Link a different wallet' : 'Link a wallet'}
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Connect a wallet on{' '}
            <a
              href="https://app.keeperhub.com"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              app.keeperhub.com
            </a>{' '}
            first, then paste its address and integration ID here — we never hold private keys
            ourselves.
          </p>
          <form onSubmit={linkWallet} className="flex flex-col gap-2">
            <input
              value={linkAddress}
              onChange={(e) => setLinkAddress(e.target.value)}
              placeholder="Wallet address (0x...)"
              required
              className="rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            />
            <input
              value={linkIntegrationId}
              onChange={(e) => setLinkIntegrationId(e.target.value)}
              placeholder="KeeperHub integration ID"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={linking}
              className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {linking ? 'Linking…' : wallet ? 'Re-link' : 'Link wallet'}
            </button>
          </form>
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
