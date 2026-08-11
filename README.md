# KeeperHub Platform

An AI agent that reasons over real-world context, decides whether to act, and — when it
decides to — executes real on-chain transactions through [KeeperHub](https://keeperhub.com),
gated by spend/action policies that are enforced independently of whatever the AI decides.

The core loop: **you describe an agent's job in plain language → it reasons over live trigger
context via an LLM → if it decides to act, KeeperHub signs and broadcasts a real transaction →
the outcome and rationale land in an audit-friendly decision log.**

## This is not a simulation

Every "execution" in this repo is a real transaction against a real chain, not a mock. Two
concrete, independently-verifiable proofs from development:

- **Direct API-triggered transfer**: [`0x56a8a55a...66587b`](https://etherscan.io/tx/0x56a8a55a5512e6e28f70254c9badd97868ce261b07fb4caf17844fa6a366587b) — confirmed on Ethereum Mainnet, block `25695024`.
- **AI-decision-triggered transfer**: [`0x8b2a12b0...02ed45`](https://etherscan.io/tx/0x8b2a12b0c9a482cd8ded803aa0e400de84356521df7b25c58b9ee6c44f02ed45) — same chain, this time the LLM read a trigger context, decided `execute` on its own, and that decision became the transaction.

Both went through KeeperHub's documented `simulate=true` preflight before broadcasting for
real, and both were gated by an `AgentPolicy` that would have blocked them had the amount or
action type not been explicitly permitted.

## Architecture, in one paragraph

A modular monolith (NestJS/TypeScript), hexagonal inside each module: domain entities know
nothing about HTTP, Prisma, or external APIs — those live behind repository/capability ports,
implemented by infrastructure adapters. Modules talk to each other only through a small public
API surface (an exported service or two), never by reaching into another module's tables. Eight
bounded contexts ship in this repo: **Identity, Settings, Audit Logs, Health Monitoring,
Wallet, KeeperHub Integration, AI**. Full detail, including the domain model and every module's
application/infrastructure layers, is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); the
day-by-day build log and the scope decisions behind it are in [`ROADMAP.md`](ROADMAP.md).

The safety-relevant part: **AgentPolicy (spend limit + allowed action kinds) is enforced by
Wallet, not by AI.** An "execute" decision from the LLM still has to clear policy before
KeeperHub Integration ever sees it — including a cumulative spend cap (an agent capped at
0.01 can't get there via ten 0.001 transfers either; `WalletService` sums prior authorized
spend before asking Settings whether a new amount still fits).

**Wallet model: bring-your-own-wallet, per agent.** Every agent links its own KeeperHub wallet
integration (`PATCH /agents/:id/wallet`) rather than sharing one platform-wide wallet — connect
a wallet on KeeperHub's dashboard, paste its address + integration ID in, done. We never hold
private key material; KeeperHub's API has no wallet-provisioning endpoint to automate that even
if we wanted to (checked directly against their MCP tool list). An agent with no wallet linked
fails closed — `WalletService.getWallet` throws rather than falling back to a default.

**Every `/agents/:agentId/*` route enforces ownership.** `AgentOwnerGuard`/`ExecutionOwnerGuard`
(the latter for the two routes keyed by `:executionId` instead) check the caller against
`Agent.ownerId` before any handler runs — an authenticated user can only see or act on their own
agents (admins excepted). This is the one thing that's genuinely dangerous to skip once more
than one real user exists, so it's applied uniformly rather than per-route as an afterthought.

## Tech stack

- **Backend**: NestJS, TypeScript, Prisma + PostgreSQL, JWT auth
- **AI reasoning**: LangChain against [Oxlo.ai](https://oxlo.ai) (OpenAI-compatible)
- **On-chain execution**: KeeperHub's MCP API (JSON-RPC over HTTP, session-based)
- **Frontend**: React + Vite + TypeScript + Tailwind
- **Containerization**: Docker Compose (Postgres + backend)

## Running it

### Option A — Docker (backend + Postgres)

```bash
cp .env.example .env   # fill in JWT secrets, KEEPERHUB_*, OXLO_* — see below
npm run docker:up
```

Backend comes up on `http://localhost:3000`, Postgres on `5433`. Migrations run automatically
on container startup.

### Option B — Local dev

```bash
npm install
npm run docker:up        # Postgres only is fine — backend runs natively below
npm run prisma:migrate
npm run start:dev

cd web
npm install
npm run dev               # http://localhost:5173
```

### Required environment variables (`.env`, see `.env.example`)

| Variable | What it's for |
|---|---|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Any random string for local dev |
| `KEEPERHUB_API_KEY` | From your KeeperHub org (app.keeperhub.com) |
| `OXLO_API_KEY` | From oxlo.ai — powers the AI reasoning step |
| `KEEPERHUB_WALLET_ADDRESS` / `KEEPERHUB_WALLET_INTEGRATION_ID` | Not read by the app itself — only used by `scripts/seed-demo.ts` as a convenient known-good wallet for the two demo agents. Real agents link their own wallet via the UI/API instead (see "Wallet model" above). |

Without `KEEPERHUB_API_KEY`/`OXLO_API_KEY`, everything runs except the two features that need a
live external API: agent evaluation and execution.

## Seeing it work

```bash
npm run seed:demo
```

Idempotent — safe to re-run. Creates a demo login (`demo@keeperhub.local` /
`DemoPassword123`), two agents, and one pre-seeded "skip" decision so the decision log isn't
empty on first look. Prints both agent IDs when done.

**Demo walkthrough:**

1. Log in at `http://localhost:5173` with the demo credentials above.
2. Open **Agents** → **Yield Watcher** — a DeFi-monitoring agent with one decision already in
   its log (the AI correctly deciding "skip" because the seeded APY was below its rule's
   threshold). Try **Evaluate now** with a higher APY in the trigger context JSON and watch it
   decide "execute" instead.
3. Open **Wallet Self-Check** — this one's primed for the real thing. Paste
   `{"instruction": "run_self_check"}` into **Evaluate now** and click **Evaluate**: the LLM
   reasons over the rule, decides to execute a transfer, `AgentPolicy` clears it, KeeperHub
   simulates it, and — if you want an actually-confirmed transaction rather than just a
   simulate-only pass — it broadcasts for real on Ethereum Mainnet (0.0005 ETH, sent back to
   the same wallet). This is the same path that produced the two transaction hashes above.
4. **Wallet**/**Executions** pages, linked from the agent detail page, show the underlying
   `PaymentAuthorization` and `Execution` records — the audit trail behind the decision.

Both the direct-API path (`POST /agents/:id/executions/transfer`) and the AI-decision path
(`POST /agents/:id/evaluate`) are available side by side — the AI is never the only way to
execute something, and it's never a way around policy either.

## Testing

`npm test` runs the Jest unit suite (domain/application layers). `npm run test:e2e` (in
`web/`) runs a Playwright end-to-end pass over the full flow — register, create an agent,
evaluate it, and confirm the decision log updates. It deliberately never links a wallet or sets
a policy on the agent it creates, so even an "execute" decision fails closed (no wallet linked)
before anything reaches KeeperHub — safe to re-run repeatedly, no real funds at risk. The real
on-chain proof is the two transaction hashes above, produced deliberately once rather than on
every test run.

## Known gaps

Documented rather than hidden — see `ROADMAP.md`'s "Known deferred hardening" for the full
list. Ownership enforcement and per-agent wallets (both listed as blockers for real multi-user
hosting) are done, and so are the three gaps that used to be listed here:

- **Destination-address allowlisting.** `AgentPolicy` can now restrict *where* a `transfer`'s
  funds go (`allowedDestinations`, checked case-insensitively). Empty list = unrestricted
  (fail-open), so existing agents aren't retroactively blocked — opt in per agent via
  `PATCH /agents/:id/policy`. `protocol_action` executions aren't covered — their `params` is an
  untyped bag with no fixed address field to check.
- **Execution status polling.** `ExecutionStatusPoller` reconciles every `submitted` execution
  against KeeperHub every 30s in the background — no manual "Refresh" click required, though the
  button still works for an immediate check.
- **Scheduled agent auto-evaluation.** `AgentEvaluationScheduler` calls the same evaluate path as
  `POST /agents/:id/evaluate` on a timer for every `active` agent — the closest thing to a live
  trigger system without a real blockchain event feed or price oracle to build one on top of.
  **Off by default** (`AGENT_SCHEDULER_ENABLED=false`) since it can spend real funds unattended;
  enable it and set `AGENT_EVALUATION_INTERVAL_MS` to turn it on.
