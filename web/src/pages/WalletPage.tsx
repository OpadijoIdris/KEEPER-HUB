import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { inputClass } from '../lib/ui';

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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Wallet</h1>
        <p className="mt-1 text-sm text-slate-400">
          Look up any agent by ID to see its linked wallet and spend history, or link one so it
          can pay for its own executions. Find an agent's ID faster via its detail page's "View
          wallet" link instead of typing it here.
        </p>
      </div>

      <form onSubmit={lookup} className="flex gap-2">
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="Agent ID"
          className={`w-64 ${inputClass}`}
        />
        <Button type="submit" disabled={loading} variant="secondary">
          {loading ? 'Loading…' : 'Look up'}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {wallet && (
        <Card className="flex flex-col gap-2">
          <div className="text-sm text-slate-400">Linked KeeperHub wallet</div>
          <div className="font-mono text-sm text-white">{wallet.address}</div>
          <div className="text-xs text-slate-500">
            integration {wallet.keeperHubIntegrationId} · linked{' '}
            {new Date(wallet.linkedAt).toLocaleString()}
          </div>
        </Card>
      )}

      {looked && agentId && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-white">
            {wallet ? 'Link a different wallet' : 'Link a wallet'}
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Connect a wallet on{' '}
            <a
              href="https://app.keeperhub.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
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
              className={`font-mono ${inputClass}`}
            />
            <input
              value={linkIntegrationId}
              onChange={(e) => setLinkIntegrationId(e.target.value)}
              placeholder="KeeperHub integration ID"
              required
              className={inputClass}
            />
            <Button type="submit" disabled={linking} className="w-fit">
              {linking ? 'Linking…' : wallet ? 'Re-link' : 'Link wallet'}
            </Button>
          </form>
        </Card>
      )}

      {wallet && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-white">Payment authorizations</h2>
          <p className="mb-3 text-xs text-slate-500">
            Every spend this wallet's agent attempted, whether its policy approved it or rejected
            it — rejections show up here too, not just successful ones.
          </p>
          {authorizations.length === 0 ? (
            <p className="text-sm text-slate-500">None yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2 pl-4 pr-4 font-medium">Decided</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {authorizations.map((auth) => (
                    <tr key={auth.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40">
                      <td className="py-2 pl-4 pr-4 text-slate-500">
                        {new Date(auth.decidedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-slate-200">
                        {auth.amount} {auth.asset}
                      </td>
                      <td className="py-2 pr-4 text-slate-200">{auth.status}</td>
                      <td className="py-2 pr-4 text-slate-500">{auth.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
