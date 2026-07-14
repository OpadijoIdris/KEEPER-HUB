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
- **Timeline**: weeks+ runway — full architectural depth is in scope, not a shortcut version.
- **Frontend** (added 2026-07-12): minimal dashboard, Vite + React + TypeScript + Tailwind, at
  `web/` (new top-level sibling folder, same repo — backend stays at root, not restructured).
  Built in lockstep with the backend: each Phase 2 module gets its matching screen once that
  module exists, not as one big push at the end.

## Known deferred hardening (tracked, not forgotten)

- **Refresh token → httpOnly cookie**: docs/ARCHITECTURE.md §7.2 specifies this, but Identity
  (Phase 2.0) ships it as plain JSON in the response body, already tested end-to-end that way.
  Switching now would mean reopening and re-verifying shipped auth code just because the frontend
  exists — deferred to a dedicated security-hardening pass instead of done ad hoc here.

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
- [ ] 2.1b `AgentPolicy` — deferred until 2.6 (AI module) exists, since its ownership check
      (§7.3) genuinely needs `Agent.ownerId` to resolve against, not a stub
- [ ] 2.2 **Audit Logs** — append-only event store, correlation with transactions/executions
- [ ] 2.3 **Health Monitoring** — liveness/readiness, KeeperHub connectivity checks, agent heartbeat
- [ ] 2.4 **Wallet** — Turnkey-backed agentic wallet provisioning, x402/MPP payment authorization
- [ ] 2.5 **KeeperHub Integration** — MCP client adapter, workflow CRUD, execute + poll, action schema discovery
- [ ] 2.6 **AI** — LangChain agent runner, rule evaluation, workflow generation from intent, decision logging
- [ ] 2.7 **Notifications** — event-driven alerts on execution outcomes, delivery channels
- [ ] 2.8 **Analytics** — transaction/execution analytics, dashboards/query API

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
- [ ] F3 **Audit log viewer** (matches 2.2)
- [ ] F4 **Health status page** (matches 2.3)
- [ ] F5 **Wallet view** (matches 2.4)
- [ ] F6 **Workflow/execution views** (matches 2.5)
- [ ] F7 **Agent list/detail + policy config + decision log** (matches 2.6, includes 2.1b AgentPolicy UI)
- [ ] F8 **Notification preferences/inbox** (matches 2.7)
- [ ] F9 **Analytics dashboard** (matches 2.8)

Each module task above expands into its own sub-checklist when we start it:
`design rationale → alternatives/tradeoffs → domain → application → infra adapter → API → tests`.

---

## Phase 3 — Cross-module integration

- [ ] 3.1 Event/domain-event wiring between modules (e.g. execution outcome → notification + analytics + audit)
- [ ] 3.2 End-to-end agent flow: create agent → configure trigger → AI evaluates → KeeperHub executes → audit/notify/analytics update
- [ ] 3.3 Authorization enforcement across module boundaries

## Phase 4 — Testing

- [ ] 4.1 Unit tests per domain/application layer
- [ ] 4.2 Integration tests per infra adapter (real Prisma test DB, KeeperHub testnet/sandbox if available)
- [ ] 4.3 E2E test of the full agent execution flow

## Phase 5 — Deployment & DevEx

- [ ] 5.1 Dockerization
- [ ] 5.2 Environment/secrets management
- [ ] 5.3 CI pipeline (lint, typecheck, test)

## Phase 6 — Hackathon polish

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
