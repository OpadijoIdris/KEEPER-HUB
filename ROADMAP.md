# KeeperHub Platform — Build Roadmap

Source of truth for project status. Update checkboxes as work completes. Each session should
read this file first to know where we stopped.

## Confirmed decisions (do not re-litigate without cause)

- **Domain**: AI-powered autonomous on-chain execution platform. Users configure AI agents that
  monitor events, evaluate business rules, and autonomously trigger real blockchain transactions.
  KeeperHub is the execution infrastructure underneath (real, external, open-source service).
- **KeeperHub integration surface** (verified from docs.keeperhub.com):
  - Remote MCP server: `https://app.keeperhub.com/mcp` — OAuth 2.1 or Bearer `kh_` API key.
    Exposes workflow CRUD (node/edge graphs), `execute_workflow`, `get_execution_status`,
    `list_action_schemas`, plugin/integration discovery, Web3 read/write actions.
  - Per-workflow narrow MCP endpoints: `https://app.keeperhub.com/mcp/w/<slug>`.
  - Agentic wallet (`@keeperhub/wallet`): Turnkey server-side custody, no private keys on disk.
    Pays per-execution via **x402** (Base, USDC, EIP-3009 `TransferWithAuthorization`) by default,
    falls back to **MPP** (Tempo, USDC.e) for MPP-only workflows.
- **Chain**: single EVM chain to start — **Base** (aligns with KeeperHub's default x402 rail).
  Chain-abstraction deferred but not blocked (ports are chain-agnostic from day one).
- **Stack**: TypeScript (strict), NestJS-style DI, Prisma ORM, LangChain for AI orchestration.
- **Architecture style**: Hexagonal / Ports & Adapters + DDD tactical patterns. Domain has zero
  knowledge of Prisma, KeeperHub, or LangChain — those are all Infrastructure adapters behind
  Ports. Modules (bounded contexts) are isolated and structurally identical.
- **Timeline — REFRAMED 2026-07-15**: originally "weeks+, full architectural depth in scope."
  Superseded: **5 days of aggressive activeness**, ending 2026-07-20. This does not touch the
  architecture (hexagonal/ports-adapters, module isolation, DDD tactical patterns all stay —
  that discipline is what's letting us move this fast without breaking what's already shipped).
  What changes is scope and per-feature verification depth from here forward. See "5-Day Sprint
  Plan" below — it supersedes the rest of Phase 2/3/4/5/6's original framing.
- **Frontend** (added 2026-07-12): minimal dashboard, Vite + React + TypeScript + Tailwind, at
  `web/` (new top-level sibling folder, same repo — backend stays at root, not restructured).
  Built in lockstep with the backend: each Phase 2 module gets its matching screen once that
  module exists, not as one big push at the end.

## Known deferred hardening (tracked, not forgotten)

- **Refresh token → httpOnly cookie**: docs/ARCHITECTURE.md §7.2 specifies this, but Identity
  (Phase 2.0) ships it as plain JSON in the response body, already tested end-to-end that way.
  Switching now would mean reopening and re-verifying shipped auth code just because the frontend
  exists — deferred to a dedicated security-hardening pass instead of done ad hoc here.
- **Per-feature unit-test suites and per-feature Playwright browser runs**: this was the standard
  through Audit Logs (2.2)/F3. From here forward (5-day reframe, 2026-07-15) the bar per feature is
  typecheck + lint + build + a curl/HTTP smoke test — real bugs still get caught cheaply, but we
  stop paying for exhaustive coverage on every new module. One full Playwright run of the complete
  demo flow happens once, near the end (Day 5), not per screen.
- **Notifications and Analytics modules**: cut from hackathon scope entirely (2026-07-15 reframe).
  Not core to the "AI agent → real on-chain execution" demo story. `EventBusPort`/`AuditEntry`
  already capture everything either module would need later — adding them back is additive, not
  a redesign, because the event-driven module boundary was never Notifications/Analytics-specific.

## Modules (bounded contexts, each structurally isolated)

1. Settings
2. Audit Logs
3. Health Monitoring
4. Wallet
5. KeeperHub Integration
6. AI
7. Notifications
8. Analytics

---

## Phase 0 — Architecture (design only, no code)

Deliverable: one architecture doc set covering all 28 requested dimensions, reviewed and
approved before any implementation starts.

- [x] 0.1 Overall system architecture + module boundary diagram
- [x] 0.2 Folder structure (monorepo layout, per-module internal layout)
- [x] 0.3 Bounded contexts + context map (relationships between the 8 modules)
- [x] 0.4 Domain model per module (entities, value objects)
- [x] 0.5 Entity relationships (cross-module, via IDs only — no foreign-key coupling across contexts)
- [x] 0.6 Aggregate roots per module
- [x] 0.7 Application services (use-case layer) per module
- [x] 0.8 Repository ports (interfaces) per module
- [x] 0.9 Infrastructure adapters (Prisma repos, KeeperHub MCP client, LangChain runner, etc.)
- [x] 0.10 API endpoints (REST surface, versioning)
- [x] 0.11 DTOs + mapping strategy (domain ↔ DTO ↔ persistence)
- [x] 0.12 Validation strategy (class-validator at boundary vs domain invariants)
- [x] 0.13 Authentication flow
- [x] 0.14 Authorization model (RBAC/ABAC, agent-level permissions/policies)
- [x] 0.15 Agent lifecycle (create → configure → activate → monitor → pause/retire)
- [x] 0.16 KeeperHub execution lifecycle (workflow build → simulate → execute → poll → settle)
- [x] 0.17 Transaction lifecycle (submitted → pending → confirmed/failed → reconciled)
- [x] 0.18 Retry strategy (execution retries, MCP call retries, backoff policy)
- [x] 0.19 Gas optimization strategy (delegate to KeeperHub's smart gas estimation; what we own vs defer)
- [x] 0.20 Failure recovery strategy (partial failures, compensating actions, dead-letter handling)
- [x] 0.21 Audit logging design (event schema, append-only store, correlation IDs)
- [x] 0.22 Observability design (tracing across AI decision → KeeperHub execution)
- [x] 0.23 Logging strategy (structured logs, levels, correlation with audit trail)
- [x] 0.24 Metrics strategy (what's measured per module, SLIs)
- [x] 0.25 Security architecture (secrets, wallet custody boundary, MCP auth token handling)
- [x] 0.26 Deployment architecture (containers, env config, secrets management)
- [x] 0.27 Testing strategy (unit/integration/e2e boundaries per layer)
- [x] 0.28 Future extensibility plan (multi-chain, new agent types, new triggers)

**Status**: doc written in full — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §1-12.
Awaiting your review/approval. No implementation starts until approved. Next action after
approval: Phase 1 scaffolding.

---

## Phase 1 — Foundation / scaffolding ✅ COMPLETE (2026-07-10)

- [x] 1.1 Tooling setup (package.json, ESLint incl. module-boundary rule, Prettier, strict tsconfig)
- [x] 1.2 NestJS app skeleton + module registration pattern (8 empty module stubs wired into AppModule)
- [x] 1.3 Prisma setup (multi-file schema, migration workflow) — infra layer only
- [x] 1.4 Shared kernel: base Entity/AggregateRoot/DomainEvent, Result type, DomainError base classes
- [x] 1.5 Correlation-ID middleware + structured logger (used by every module)
- [x] 1.6 Base testing harness (Jest config, sample unit test passing)

**Verified**: lint clean, typecheck clean, unit tests pass, production build succeeds, app boots
and connects to a real local Postgres (`keeperhub_platform` db), HTTP server confirmed listening.

**Notable calls made during Phase 1** (deviations/additions beyond the original plan, all low-risk
since no feature code existed yet):
- Upgraded NestJS 10→11 and Prisma 5→7 immediately after install, since both had already-known
  vulnerabilities/deprecations in the versions initially installed and this was the cheapest
  possible time to move (zero code depended on the old APIs yet). Prisma 7 changed client
  construction to a driver-adapter model (`@prisma/adapter-pg`) and moved the connection URL to a
  new `prisma.config.ts` — see that file and `src/shared/infrastructure/prisma/prisma.service.ts`.
- Swapped `bcrypt` → `bcryptjs` before any code used it (pure JS, no native compilation, removes a
  Docker/deployment dependency for zero cost).
- Pinned `multer` via a package.json `overrides` entry (transitive dep of `@nestjs/platform-express`,
  not actually used by our code — no file upload endpoints exist).
- Discovered `eslint-plugin-boundaries` defaults to folder-level path matching (`mode: 'folder'`),
  which silently no-ops a file-level pattern like `index.ts` — fixed by setting `mode: 'full'` on
  every element definition. Verified with a throwaway cross-module import that the rule now
  correctly blocks reaching into another module's internals while allowing imports via its
  `index.ts` public API.
- Local dev Postgres: using the existing local `postgresql-x64-18` Windows service, `postgres` user,
  dedicated `keeperhub_platform` database created for this project. Credentials live in `.env`
  (gitignored, not committed).

---

## Phase 2 — Module implementation (one feature at a time, design discussion before code)

Order chosen by dependency: cross-cutting modules first, then wallet (needed for payment),
then KeeperHub integration (needed for execution), then AI (orchestrates the above), then
the modules that consume events from execution (notifications, analytics).

- [x] 2.0 **Identity & Auth** ✅ (2026-07-12) — full module at `src/modules/identity/`
      (docs/ARCHITECTURE.md §7.1). User entity + Email/PlaintextPassword/PasswordHash VOs,
      RefreshToken entity with rotation, AuthService (register/login/refresh), bcryptjs hasher,
      JWT access tokens + opaque HMAC-hashed refresh tokens, JwtAuthGuard + @CurrentUser().
      23 unit tests passing (domain VOs/entities + AuthService against hand-written port fakes).
      Verified end-to-end against real Postgres: register, duplicate-email 409, wrong-password 401,
      refresh rotation, old-token-reuse-after-rotation 401, weak-password 400, mass-assignment 400.
- [x] 2.1a **Settings: UserPreferences + PlatformSettings** ✅ (2026-07-12) — `UserPreferences`
      (timezone via IANA-validated VO, per-channel notification prefs) + `PlatformSettings`
      (singleton feature-flag store), `PlatformSettingsService.isFeatureEnabled()` exported as
      Public API for other modules. Also added two reusable shared guards: `SelfOrAdminGuard`
      (factory, param-name-based — resource ID *is* the current user's ID, no cross-module lookup)
      and `AdminOnlyGuard`. 14 new unit tests (37 total across the app). Verified end-to-end:
      GET defaults without persisting, PATCH persists both timezone+channel in one round trip,
      GET/PATCH on another user's preferences → 403, unauthenticated → 401, feature-flags readable
      by any authenticated user, write rejected for non-admin → 403.
- [x] 2.1b `AgentPolicy` ✅ (2026-08-11) — bundled into 2.6 (AI module) as planned, shipped and
      verified together — see 2.6 below.
- [x] 2.2 **Audit Logs** ✅ (2026-07-15) — `AuditEntry` (leaf aggregate, append-only by omission —
      no update/delete method exists anywhere in the chain), `AuditEventSubscriber` via the event
      bus's new `subscribeToAll()`. Required extending the shared `DomainEvent` base with
      `subject`/`actor`/`severity` declared by the event itself (not guessed later by Audit Logs
      from an opaque payload — see log entry below), which touched already-shipped Identity code;
      re-ran Identity's tests to confirm nothing broke. `GET /audit-log` (admin-only, paginated,
      filterable by correlationId/subjectId/eventType). Verified end-to-end: registered a user,
      confirmed the resulting `identity.user.registered` event was captured with correct
      subject/actor/payload, confirmed non-admin → 403, unauthenticated → 401, subjectId filter
      correctly narrows results.
- [x] F3 **Audit log viewer** ✅ (2026-07-15) — admin-gated route (`AdminRoute`), filterable/
      paginated table with an expandable raw-payload row. Build + lint clean; per the 5-day
      reframe this one didn't get the full Playwright treatment Settings (F2) got — reduced
      verification bar applies from here forward, see "Known deferred hardening."
- [ ] ~~2.3 Health Monitoring~~ — cut to a trivial `/health` liveness check only, folded into
      whichever module ends up owning `main.ts` wiring; not a separate module build (5-day reframe)
- [x] 2.4 **Wallet** ✅ (2026-08-01) — revised per live KeeperHub reconnaissance: links agentId to
      the org's existing wallet integration (no provisioning), `PaymentAuthorization` records every
      decision (always-authorize for now, spend-limit enforcement wired in Day 3 alongside
      AgentPolicy). `GET /agents/:agentId/wallet` (idempotent link-or-return) and
      `/wallet/authorizations`. Verified end-to-end against the containerized backend.
- [x] 2.5 **KeeperHub Integration** ✅ (2026-08-02) — revised per reconnaissance: direct execution
      primitives (`execute_transfer`, `execute_protocol_action`), not workflow graphs. MCP client
      adapter owns the session handshake (`initialize` → `notifications/initialized`, cached
      session id, re-initializes once on session-expiry error) and JSON-RPC `tools/call`.
      `Execution` aggregate: `id` doubles as the idempotency key passed to KeeperHub. Calls
      `WalletService.authorizePayment` before every execution (Customer/Supplier relationship).
      On-demand status refresh (`POST /executions/:id/refresh`), not a background poller — see
      the module's design note for why. **Verified against the real API**: session handshake +
      `search_protocol_actions` (real Chronicle oracle action list came back), 404 on unknown
      execution, empty list for a fresh agent, 401 unauthenticated. **Deliberately not verified**:
      the actual `execute_transfer`/`execute_protocol_action` write path — that moves real funds,
      and the user chose to hold that off for Day 4's full demo run rather than exercise it
      incidentally during module verification.
- [x] 2.6 **AI** ✅ (2026-08-11) — LangChain agent runner (`OxloAgentReasoningAdapter`): Agent +
      Decision entities, rule evaluation, ties Wallet + KeeperHub Integration together.
      `AgentPolicy` (2.1b) added here. **Verified against the real Oxlo.ai API and the live
      Render deployment, not just unit tests**: `POST /agents/:id/evaluate` with
      `{"currentApy": "5.2%"}` correctly reasoned `skip` (below the rule's 8% threshold); with
      `{"currentApy": "9.5%"}` correctly flipped to `execute`, with real model-generated
      rationale text, and dispatched into `ExecutionService.executeTransfer` — which
      `AgentPolicy` then correctly rejected (100 USDC vs. a 0.01 spend limit), proving the full
      "AI decides → Wallet/Policy gates independently" chain wired together end to end, not just
      each half in isolation. Every decision persisted and showed up in both the Decision log and
      the admin audit log. **Not verified**: an `execute` decision resolving to a
      `protocol_action` (only `transfer`-kind decisions were exercised).
- [ ] ~~2.7 Notifications~~ — cut (5-day reframe, see "Known deferred hardening")
- [ ] ~~2.8 Analytics~~ — cut (5-day reframe, see "Known deferred hardening")

### Frontend (`web/`), matched screen-per-backend-module, built right after each lands

- [x] F0 **Scaffold** ✅ (2026-07-14) — Vite + React + TS + Tailwind v4 at `web/`. API client
      (`apiFetch`) with Bearer-token attach + one-shot auto-refresh-on-401, `AuthProvider`/`useAuth`,
      `ProtectedRoute`, `Layout` with nav + logout. Backend `main.ts` got `enableCors()` (required,
      not optional, for a cross-origin dev server to reach the API at all).
- [x] F1 **Auth** ✅ (2026-07-14) — Login/Register screens, wired to `/auth/login`/`/auth/register`.
- [x] F2 **Settings** ✅ (2026-07-14) — timezone field + notification-channel checkboxes wired to
      `/users/:userId/preferences`, read-only feature-flags list from `/feature-flags`.
      **Verified with a real headless-Chromium run** (Playwright, driver script in scratchpad —
      no reusable project skill existed yet): register → redirect to /settings → confirmed UTC +
      email-only defaults → changed timezone → toggled webhook channel → reloaded the page →
      confirmed both changes persisted server-side → logged out → confirmed redirect to /login.
      Zero console errors, zero failed/5xx requests. **Caught a real bug this way**: the webhook
      checkbox had no optimistic update, so `setStatus('saving')` forced a re-render that snapped
      the controlled checkbox back to its pre-click value until the PATCH resolved — invisible in
      unit tests, immediately visible as a failed Playwright `.check()` assertion. Fixed.
- [ ] ~~F4 Health status page~~ — cut, a `/health` 200 check is not worth a screen (5-day reframe)
- [x] F5 **Wallet view** ✅ (2026-08-01) — agentId lookup form (Agents don't exist until Day 3,
      so this is lookup-by-id rather than a "your agents" list for now) showing the linked
      KeeperHub wallet address + integration id, and a payment-authorization history table.
      Build + lint clean; no per-screen Playwright run per the reduced verification bar.
- [x] F6 **Execution views** ✅ (2026-08-02) — agent execution history table with status refresh,
      protocol-action browser, and a transfer-submission form gated behind an explicit "I
      understand this moves real funds" checkbox. Build + lint clean; not click-tested live today
      (same real-funds reasoning as the backend verification note above) — first live use is the
      Day 4 demo run.
- [x] F7 **Agent list/detail + policy config + decision log** ✅ (2026-08-11) — matches 2.6,
      includes 2.1b AgentPolicy UI. **Click-tested live against the deployed frontend**: created
      an agent, set spend limit + allowed actions, activated it, ran "Evaluate now" with both a
      below-threshold and an above-threshold trigger context and watched the decision log update
      with `skip` then `execute` in real time, followed the resulting execution link through to
      the Executions page.
- [ ] ~~F8 Notifications~~ / ~~F9 Analytics~~ — cut with their backend modules (5-day reframe)

From here forward: typecheck + lint + build + curl/HTTP smoke test per feature (not full unit
suites + per-feature Playwright — see "Known deferred hardening"). One full Playwright run of the
complete demo flow near the end, not per screen.

---

## KeeperHub live API reconnaissance (2026-07-15) — supersedes assumptions in docs/ARCHITECTURE.md

Got a real `KEEPERHUB_API_KEY`, did the MCP handshake (`initialize` → `notifications/initialized`
→ `tools/list`) against `https://app.keeperhub.com/mcp`, and called `list_integrations` +
`list_workflows` against the real org. Three findings that meaningfully simplify the remaining
build — architecture doc §9.1/§4.4/§4.5 described the assumptions being corrected here, doc
updates deferred to when those modules are actually touched rather than done speculatively now:

1. **A wallet integration already exists on this org**: `0xcA7D64a1BFDe573207859E6dC02332c120B35dAe`
   (type `web3`, `isManaged: false`). We do **not** need to build Turnkey/`@keeperhub/wallet`
   provisioning ourselves for the demo — Wallet module shrinks to: reference this `integrationId`,
   track `PaymentAuthorization`/audit records, optionally read balance.
2. **Direct execution primitives exist outside the workflow graph system**: `execute_transfer`,
   `execute_contract_call`, and `search_protocol_actions`/`execute_protocol_action` (pre-built DeFi
   actions across Aave/Compound/Uniswap/Chronicle-Chainlink/Lido/Morpho, addressed as
   `protocol/action-slug`, e.g. `chronicle/eth-usd-read`, `aave-v3/supply`). **KeeperHub
   Integration will call these directly rather than constructing `create_workflow` node/edge
   graphs** — a better fit for an AI agent deciding to act (a direct tool call, not building a
   graph) and substantially less to implement/validate. `execute_workflow`/`create_workflow` stay
   available if a demo scenario ever wants a schedule/event-triggered background workflow instead.
3. **Every execution tool takes an `idempotency_key`** (`execute_workflow`, `execute_transfer`,
   `execute_contract_call`, `execute_check_and_execute`) — retried with the same key+args within
   24h returns the original result instead of re-executing; different args on a reused key is a
   409. This replaces the "check status before retrying" workaround in §9.1 (which assumed no
   native idempotency support) — we just pass our `Execution.id` as the key. Simpler *and* more
   correct than what was designed without this knowledge.
   - Three pre-seeded example workflows on the org (Aave health-factor monitor, large-withdrawal
     alert, Aave governance alert) are useful reference for real KeeperHub workflow JSON shape if
     we do end up building one, but aren't part of the critical path.

## 5-Day Sprint Plan (supersedes Phase 3-6 below as the operative plan)

Ends 2026-07-20. Sequenced hardest/riskiest-unknown-first (KeeperHub Integration is a real
external API we hadn't touched before 2026-07-15 — de-risk it early, not on day 4 when there's no
slack left). Revised lighter per the reconnaissance above.

- **Day 1** — Wallet (2.4) + F5, now small: reference the existing `integrationId`, no Turnkey
  provisioning to build. `PaymentAuthorization` tracking + optional balance read.
- **Day 2** — KeeperHub Integration (2.5) + F6: `KeeperHubClientPort` wrapping the MCP client
  (session handshake + `execute_transfer`/`execute_contract_call`/`execute_protocol_action` +
  `get_direct_execution_status`), idempotency key = `Execution.id`.
- **Day 3** — AI (2.6) + 2.1b AgentPolicy + F7. Wires Wallet + KeeperHub Integration together
  behind an `Agent`/`Decision` model.
- **Day 4** — Phase 3 lite: one real end-to-end run of agent create → trigger → AI decision →
  KeeperHub execution → shows up in the audit trail. Fix whatever breaks (something will).
- **Day 5** — Buffer (assume Day 1-4 slipped, because they will). Seed data/demo script, README
  for judges, one full Playwright run of the complete flow, Docker only if time remains — it's the
  first thing to drop, not lint/typecheck/build.

## Phase 3 — Cross-module integration (folded into 5-Day Sprint Day 4 above)

- [ ] 3.1 Event wiring for the flow that actually ships: execution outcome → audit (Notifications/
      Analytics wiring cut along with those modules)
- [ ] 3.2 End-to-end agent flow: create agent → configure trigger → AI evaluates → KeeperHub executes → audit trail updates
- [ ] 3.3 Authorization enforcement across the modules that ship

## Phase 4 — Testing (superseded — see "Known deferred hardening": fast loop only from 2.2 onward)

- [x] 4.1 Unit tests per domain/application layer — done through 2.2 (Audit Logs), not required per-feature after
- [ ] 4.2 Integration tests per infra adapter — cut for the hackathon window, revisit post-demo
- [ ] 4.3 E2E test of the full agent execution flow — the one Playwright run on Day 5

## Phase 5 — Deployment & DevEx

- [x] 5.1 Dockerization ✅ (2026-07-15, done early — user had Docker available and it removes the
      local-Postgres dependency entirely) — multi-stage `Dockerfile` (build → runtime, full
      `node_modules` copied through since `prisma migrate deploy` at container startup needs the
      `prisma` CLI, a devDependency) + `docker-compose.yml` (postgres + backend). Postgres mapped
      to host port 5433, not 5432, to avoid clashing with the local Postgres install day-to-day dev
      still uses. `npm run docker:up`/`docker:down`/`docker:logs`. Verified end-to-end: fresh
      `docker compose up --build`, migrations ran automatically at container startup, registered a
      user against the fully containerized stack successfully, unauthenticated request correctly
      rejected. Frontend intentionally not containerized (bigger lift, smaller payoff for a 5-day
      window) — local Vite dev server still points at `http://localhost:3000` either way.
- [ ] 5.2 Environment/secrets management — already have this (`.env` + `SecretsProviderPort` pattern), no new work
- [ ] 5.3 CI pipeline — cut for the hackathon window

## Phase 6 — Hackathon polish (= Day 5 above)

- [ ] 6.1 Seed data / demo scenario script
- [ ] 6.2 README + architecture diagram for judges
- [ ] 6.3 Live demo dry run (real Base testnet transaction end-to-end)

---

## Log

- 2026-07-06: Roadmap created. Domain, stack, chain, and KeeperHub integration surface confirmed.
  Next up: Phase 0 architecture doc.
- 2026-07-06: Phase 0 architecture doc completed (docs/ARCHITECTURE.md §1-12, all 28 dimensions).
  Notable calls made: modular monolith over microservices; single NestJS app over Nx monorepo,
  boundary enforced by eslint-plugin-boundaries instead; identity/auth added as a shared-kernel
  concern since none of the 8 modules owns it; two-layer authorization (human/ownership vs
  agent-execution/policy); non-idempotent `execute_workflow` retry handled via status-check-first,
  not blind retry (real-money correctness risk); we deliberately do not reimplement KeeperHub's
  gas-bump/stuck-tx recovery. Awaiting user review before Phase 1 scaffolding begins.
- 2026-07-10: Phase 1 foundation/scaffolding completed and fully verified (lint, typecheck, unit
  tests, production build, and a real runtime boot against local Postgres all pass). See Phase 1
  section above for the notable version-upgrade and tooling-config decisions made along the way.
  Next up: Phase 2, starting with the Settings module (see "Phase 2" section below for order/rationale).
- 2026-07-10: Fixed TS 7.0 deprecation warnings surfaced by the editor on tsconfig.json rather than
  suppressing them: `moduleResolution: "node"` → `"node16"` (paired with `module: "node16"`),
  removed unused `baseUrl`, added explicit `rootDir: "./src"` and `isolatedModules: true` (the
  latter required by node16 module resolution, set as a native compiler option rather than a
  ts-jest transform option per its own deprecation notice). Also dropped `test/**/*.ts` from the
  root tsconfig's `include` — it doesn't exist yet and would violate the new explicit `rootDir`
  once e2e tests are added in Phase 4 with their own config. Found and fixed a stale
  `.tsbuildinfo` incremental-build cache masking the rootDir change (silent zero-output build);
  added `*.tsbuildinfo` to .gitignore. Re-verified lint/typecheck/test/build/boot all still pass.
- 2026-07-12: Phase 2.0 Identity & Auth completed (see Phase 2 section above for full detail).
  Inserted ahead of Settings — every module's controllers need `JwtAuthGuard`/`@CurrentUser()`,
  and building them without auth first would mean redoing it later. Deviated from the
  architecture doc's original `shared/infrastructure/identity/` sketch in favor of a full
  first-class module at `modules/identity/` (doc updated to match, §7.1) — real business rules
  (email uniqueness, password policy) don't belong in a folder reserved for adapters, and this
  way it's covered by the boundaries lint rule automatically. Also caught and fixed a real
  incompatibility: Prisma 7's `prisma-client` generator emits ESM (`import.meta.url`) by default,
  which crashed the CJS build at runtime — fixed with `moduleFormat = "cjs"` in the generator
  block (prisma/schema/schema.prisma), not caught by typecheck since it's a pre-built generated
  file, only surfaced by actually booting the compiled output. Next up: Phase 2.1, Settings.
- 2026-07-12: Phase 2.1a (Settings: UserPreferences + PlatformSettings) completed — see Phase 2
  section above. Split `AgentPolicy` out into 2.1b, deferred until AI's `Agent` aggregate exists
  (Phase 2.6) since its ownership check needs a real `ownerId` to resolve against, not a stub —
  same reasoning as inserting Identity ahead of Settings: don't build an authorization check that's
  known-incomplete when the correct version is buildable later for roughly the same cost. Added
  two reusable cross-module guards to the shared kernel (`SelfOrAdminGuard`, `AdminOnlyGuard`)
  rather than one-off logic in this module's controllers, since Notifications will need the same
  "only the resource owner or an admin" check. Next up: Phase 2.2, Audit Logs.
- 2026-07-12: Repo created on GitHub (OpadijoIdris/KEEPER-HUB), initial commit pushed to `main`
  covering Phase 0-2.1a. Verified `.env` and all build/generated artifacts were correctly excluded
  before pushing.
- 2026-07-13/14: Scoped and built the frontend (`web/`), decided to go in lockstep with backend
  modules going forward rather than as one push at the end — see "Known deferred hardening" and
  the Frontend subsection above for what shipped (F0-F2) and the real bug a headless-browser test
  caught (optimistic-update gap on the notification-channel checkbox). No project run-skill existed
  for this repo yet, so verification used a throwaway Playwright driver script in scratchpad rather
  than a committed one — worth generating a proper one via /run-skill-generator if UI verification
  becomes routine going forward. Next up: Phase 2.2, Audit Logs (+ its matching F3 frontend screen).
- 2026-07-15: Phase 2.2 (Audit Logs) + F3 completed — see entries above. Extended shared
  `DomainEvent` base with `subject`/`actor`/`severity` (each event declares its own, rather than
  Audit Logs guessing from an opaque payload) and added `EventBusPort.subscribeToAll()` — both
  touched Phase 1 shared-kernel code, re-verified nothing broke.
- 2026-07-15: **Timeline reframed** — see "Confirmed decisions" and "5-Day Sprint Plan" above.
  User's call: this is a hackathon, it doesn't need to be "entirely good," 5 days of aggressive
  activeness starting now. Cut Notifications + Analytics modules entirely, cut Health Monitoring
  to a trivial check, dropped per-feature unit-test-suite + per-feature-Playwright as the standard
  going forward (fast loop: typecheck/lint/build/curl only). Architecture/module-isolation
  discipline is unchanged — what's cut is breadth (2 modules) and per-feature verification depth,
  not the ports-and-adapters structure that's letting us move this fast without breaking what's
  shipped. Next up: Day 1 of the sprint — Wallet module, pending research into `@keeperhub/wallet`'s
  actual programmatic surface and a `KEEPERHUB_API_KEY` from the user (currently blank in `.env`).
- 2026-07-15: Docker containerization done early (user had Docker available) — see Phase 5.1 above.
  User signed up at app.keeperhub.com and provided a real `KEEPERHUB_API_KEY`. Did live MCP
  reconnaissance against the real API — see "KeeperHub live API reconnaissance" section above.
  Found an existing wallet integration and direct execution primitives (`execute_transfer`,
  `execute_contract_call`, `execute_protocol_action`) that meaningfully shrink Day 1-2 scope
  versus what was assumed when the architecture doc was written. Next up: Day 1, Wallet module.
- 2026-08-01: Day 1 complete — Wallet module + F5. Local Postgres Windows service had stopped and
  couldn't be restarted without admin rights; switched local dev to the containerized Postgres
  (port 5433) instead, which is now the default in `.env.example`. Twice today `node_modules` was
  found completely missing (once for the backend, once for `web/`) with no clear cause from this
  session's actions — reinstalled both times (`npm ci` / `npm install`), no data lost since
  `package-lock.json` was intact, but worth the user checking for anything on this machine
  (antivirus, disk cleanup tool, etc.) that might be deleting it. Pushed every milestone from
  today to GitHub per user instruction (Audit Logs, Docker, Wallet — 3 separate commits). Hit a
  git push permission error (Credential Manager authenticated as a different GitHub account than
  the repo owner) — user provided a one-time PAT, used inline on the push command only (never
  written to git config or any file), user to revoke it now that the push succeeded. Next up:
  Day 2, KeeperHub Integration module.
- 2026-08-02: Day 2 complete — KeeperHub Integration module + F6. Same push-permission error
  recurred (Credential Manager still not fixed on the user's end) — used another one-time PAT the
  same way. Also: our Postgres container had exited (unrelated container from another project,
  `branda-core-api-postgres-1`, is squatting on host port 5432 — worth the user's awareness, not
  a conflict with our setup since we're on 5433, but explains earlier confusion about "which
  Postgres is running"). Verified the MCP session handshake and `search_protocol_actions` against
  the real API; held off on `execute_transfer`/`execute_protocol_action` since those move real
  funds — user chose to defer the first real execution to Day 4's deliberate demo run rather than
  trigger one incidentally during module verification. Next up: Day 3, AI module.
