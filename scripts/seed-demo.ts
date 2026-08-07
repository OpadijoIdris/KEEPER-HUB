/**
 * Demo seed script (ROADMAP.md Phase 6.1). Talks to the running API over
 * HTTP rather than writing to Postgres directly, so it exercises the same
 * validated path a real user would (password hashing, domain events,
 * AgentPolicy defaults) instead of a parallel one that can drift from it.
 *
 * Usage: npm run seed:demo   (backend must already be running on API_BASE_URL)
 */
import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo@keeperhub.local';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'DemoPassword123';
const SELF_TRANSFER_ADDRESS =
  process.env.KEEPERHUB_WALLET_ADDRESS ?? '0xcA7D64a1BFDe573207859E6dC02332c120B35dAe';
const SELF_TRANSFER_INTEGRATION_ID = process.env.KEEPERHUB_WALLET_INTEGRATION_ID ?? '';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

async function api<T>(path: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

async function ensureDemoUser(): Promise<Tokens> {
  try {
    const tokens = await api<Tokens>('/auth/login', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    console.log(`Logged in as existing demo user (${DEMO_EMAIL}).`);
    return tokens;
  } catch {
    const tokens = await api<Tokens>('/auth/register', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    console.log(`Registered new demo user (${DEMO_EMAIL}).`);
    return tokens;
  }
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

async function findOrCreateAgent(
  token: string,
  name: string,
  monitoredTrigger: string,
  rules: string,
): Promise<Agent> {
  const existing = await api<Agent[]>('/agents', { token });
  const found = existing.find((a) => a.name === name);
  if (found) {
    console.log(`Agent "${name}" already exists (${found.id}).`);
    return found;
  }
  const agent = await api<Agent>('/agents', {
    method: 'POST',
    token,
    body: { name, monitoredTrigger, rules },
  });
  console.log(`Created agent "${name}" (${agent.id}).`);
  return agent;
}

async function setPolicy(
  token: string,
  agentId: string,
  spendLimit: string,
  allowedActions: string[],
): Promise<void> {
  await api(`/agents/${agentId}/policy`, {
    method: 'PATCH',
    token,
    body: { spendLimit, allowedActions },
  });
}

async function activate(token: string, agentId: string): Promise<void> {
  await api(`/agents/${agentId}/activate`, { method: 'POST', token });
}

/** Bring-your-own-wallet (README.md "Wallet model") — both demo agents share the
 * one real wallet already connected on KeeperHub's dashboard for convenience; in
 * a real multi-agent setup each would link a distinct one the same way. */
async function linkWallet(token: string, agentId: string, address: string, integrationId: string): Promise<void> {
  if (!integrationId) {
    console.warn(`  Skipping wallet link for ${agentId} — KEEPERHUB_WALLET_INTEGRATION_ID not set.`);
    return;
  }
  await api(`/agents/${agentId}/wallet`, {
    method: 'PATCH',
    token,
    body: { address, keeperHubIntegrationId: integrationId },
  });
}

async function main() {
  console.log(`Seeding demo data against ${API_BASE_URL} ...`);
  const { accessToken } = await ensureDemoUser();

  // Agent 1: DeFi yield watcher — demonstrates the AI reading real-looking
  // context and correctly deciding "skip" when the rule isn't satisfied.
  // Seeded with a below-threshold decision so the decision log isn't empty
  // the first time a judge opens it.
  const yieldWatcher = await findOrCreateAgent(
    accessToken,
    'Yield Watcher',
    'USDC lending APY on Aave (Base chain)',
    'If the APY rises above 8%, deposit 100 USDC. Otherwise do nothing.',
  );
  await setPolicy(accessToken, yieldWatcher.id, '0.01', ['transfer', 'protocol_action']);
  await linkWallet(accessToken, yieldWatcher.id, SELF_TRANSFER_ADDRESS, SELF_TRANSFER_INTEGRATION_ID);
  await activate(accessToken, yieldWatcher.id);
  try {
    console.log('Evaluating Yield Watcher with a below-threshold APY (real LLM call, no funds moved)...');
    await api(`/agents/${yieldWatcher.id}/evaluate`, {
      method: 'POST',
      token: accessToken,
      body: { triggerContext: { currentApy: '5.2%', chain: 'Base', asset: 'USDC' } },
    });
    console.log('Seeded one "skip" decision on Yield Watcher.');
  } catch (error) {
    console.warn(`Skipped seeding a decision (Oxlo call failed?): ${error instanceof Error ? error.message : error}`);
  }

  // Agent 2: wallet self-check — intentionally left un-evaluated. This is
  // the one to trigger live during the actual demo: evaluating it with
  // instruction="run_self_check" produces a real, on-chain-confirmed
  // Ethereum mainnet transaction in front of the audience (see ROADMAP.md
  // "KeeperHub live API reconnaissance" — the wallet + policy are already
  // primed for this, only the live click is deferred).
  const selfCheck = await findOrCreateAgent(
    accessToken,
    'Wallet Self-Check',
    'A manual heartbeat signal requesting a routine wallet self-check transfer',
    `When triggered with instruction="run_self_check", transfer 0.0005 ETH on chain "1" (Ethereum Mainnet) to address ${SELF_TRANSFER_ADDRESS} (send it back to the same wallet this agent controls, as a routine liveness check). For any other instruction, or if the instruction is missing, skip.`,
  );
  await setPolicy(accessToken, selfCheck.id, '0.01', ['transfer']);
  await linkWallet(accessToken, selfCheck.id, SELF_TRANSFER_ADDRESS, SELF_TRANSFER_INTEGRATION_ID);
  await activate(accessToken, selfCheck.id);

  console.log('\nDemo seed complete.');
  console.log(`  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Yield Watcher agent:    ${yieldWatcher.id}  (has a pre-seeded "skip" decision)`);
  console.log(`  Wallet Self-Check agent: ${selfCheck.id}  (trigger live: {"instruction":"run_self_check"})`);
}

main().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
