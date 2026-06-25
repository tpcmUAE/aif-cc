# AIF Command Center Build Plan v1

Version: 2026-06-25 v1  
Status: Proposed implementation plan  
Repository: `tpcmUAE/aif-cc`  
Product: AIF Command Center

## 1. Purpose

This document defines the recommended high-level work needed to turn `tpcmUAE/aif-cc` into the working AIF Command Center: a trusted operator cockpit for observing, governing, and safely steering AI Factory.

The Command Center should answer four questions quickly:

```text
What is happening in AI Factory now?
What needs attention?
Which jobs, workers, PRs, evidence packets, gates, alerts, and approvals are pending?
What bounded action may an authorized operator safely request through AIF Core?
```

The first production milestone should be a live, authenticated, read-only cockpit. Bounded operator actions should be added only after the read-only system, authorization model, API contracts, and audit trail are proven.

## 2. Strategic position

AIF Command Center is:

- the internal operator cockpit for Izu, CTO, JAVIS Ops, and other trusted operators;
- a product client of AIF Core;
- responsible for operational visibility, triage, drill-down, and approved action requests;
- the richer desktop counterpart of the future mobile status and approval surface.

AIF Command Center is not:

- AIF Core;
- AIF Studio;
- AIF Marketplace;
- the worker scheduler;
- a direct shell, merge, deployment, or branch-mutation tool;
- the owner of runtime safety policy.

## 3. Core architectural rule

AIF Core remains the execution and safety authority.

```text
AIF Command Center
    observes state
    renders operational summaries
    submits bounded requests
    displays results and audit history

AIF Core
    authenticates and authorizes requests
    re-checks policy and runtime safety
    executes or rejects actions
    owns gates, approvals, scheduler, workers, and audit truth
```

The Command Center must never directly:

- run arbitrary shell commands;
- merge pull requests;
- deploy services or applications;
- mutate Git branches;
- read secrets or dump environment variables;
- bypass approval intake;
- bypass validation or merge gates;
- write directly to local Factory data files;
- pretend that missing data is live or healthy;
- expose unrestricted raw logs by default.

## 4. Existing implementation to reuse

The current transitional Command Center in `tpcmUAE/tpcm-ai-factory/apps/web-console` is the functional reference and migration baseline.

Existing useful work includes:

- `/home` executive Command Hub;
- `/mission-board` operational Mission Board;
- factory and runtime health panels;
- worker-run and heartbeat visibility;
- task, result-intake, review, approval, validation, and merge-gate surfaces;
- provider/model and estimated cost visibility;
- explicit `UNKNOWN` and `SAMPLE` fallback behavior;
- read-only safety posture;
- approved status states and UI specification;
- merged Command Center MVP work from core PR #150.

The new repository should not blindly copy the old implementation. It should extract the proven operating model, normalize it around versioned Core contracts, improve the product structure, and remove direct coupling to Core-local stores.

## 5. Recommended milestone structure

```text
Milestone 0: Architecture and contracts
Milestone 1: Repository and mock-first product foundation
Milestone 2: Live read-only operational cockpit
Milestone 3: Authentication, resilience, and release hardening
Milestone 4: Production cutover from the in-core console
Milestone 5: Audited bounded operator actions
```

The initial release target should be:

> AIF Command Center v0 — Extracted Live Read-Only Cockpit

The later controlled-action target should be:

> AIF Command Center v1 — Audited Bounded Operator Steering

## 6. High-level parent tasks

### Parent 1 — Finalize architecture, repository identity, and ownership

**Priority:** P0  
**Primary owner:** AIF Core architecture / CTO  
**Repositories:** `tpcm-ai-factory`, `aif-cc`

Required outcomes:

1. Confirm `tpcmUAE/aif-cc` as the canonical repository name.
2. Decide repository visibility and access policy.
3. Record ownership boundaries between Core and Command Center.
4. Decide the supported deployment model for development, preview, staging, and production.
5. Define which diagnostic UI, if any, remains inside AIF Core after cutover.
6. Define cross-repository change and release governance.
7. Update strategy and architecture documents so they use one canonical repository name.

Acceptance criteria:

```text
CANONICAL_REPO=tpcmUAE/aif-cc
CORE_BOUNDARY_DOCUMENTED=yes
COMMAND_CENTER_BOUNDARY_DOCUMENTED=yes
DEPLOYMENT_MODEL_SELECTED=yes
REPO_VISIBILITY_DECIDED=yes
MIGRATION_POLICY_DOCUMENTED=yes
```

### Parent 2 — Inventory the transitional console and define v0 parity

**Priority:** P0  
**Primary owner:** Command Center product/architecture  
**Source repository:** `tpcm-ai-factory`

Create an inventory of:

- current routes;
- panels and cards;
- backend endpoints;
- local files and databases used by each endpoint;
- status calculations;
- empty, error, and stale-state behavior;
- refresh behavior;
- links and drill-down paths;
- tests;
- current read and mutation controls;
- Studio-only or obsolete surfaces that should not move.

Classify every capability as:

```text
MOVE_TO_AIF_CC
KEEP_AS_CORE_DIAGNOSTIC
MOVE_TO_AIF_STUDIO
REPLACE_WITH_CORE_API
RETIRE
BACKLOG
```

Deliverables:

- capability and data-source matrix;
- route and panel parity checklist;
- screenshots of the current reference UI;
- sanitized representative payload fixtures;
- explicit non-goals for v0;
- cutover acceptance baseline.

### Parent 3 — Define AIF Core to Command Center API and event contracts v0

**Priority:** P0 and architecture gate  
**Primary owner:** AIF Core  
**Consumer:** `aif-cc`

This is the central dependency for safe parallel development.

Initial contract types:

```text
FactoryStatus
ServiceHealth
JobSummary
JobDetail
WorkerQueueSummary
WorkerRunSummary
ReviewQueueItem
EvidenceResult
ValidationGateSummary
MergeGateSummary
ApprovalPacketSummary
DecisionAlert
AuditEvent
BudgetCapacitySummary
```

Recommended read endpoints:

```text
GET /health
GET /factory/status
GET /services
GET /jobs
GET /jobs/{job_id}
GET /workers/runs
GET /workers/runs/{run_id}
GET /review-queue
GET /evidence
GET /evidence/{request_id}
GET /validation-gates
GET /merge-gates
GET /approval-packets
GET /decision-alerts
GET /audit/events
GET /budget/capacity
```

Exact endpoint names may change. The ownership boundary must not.

Every operational object should carry a common envelope similar to:

```text
schema_version
entity_id
status
source
observed_at
generated_at
freshness
is_stale
data_kind=LIVE|SAMPLE|ESTIMATED|ACTUAL|UNKNOWN
correlation_id
github_links[]
redactions[]
```

The contract must define:

- authentication and authorization scopes;
- pagination and filtering;
- stable identifiers;
- timestamp format and timezone behavior;
- freshness and stale thresholds;
- error response format;
- partial-result behavior;
- secret and log redaction rules;
- rate limits and refresh guidance;
- schema versioning and compatibility policy;
- event sequence and reconnect behavior;
- fixture generation for consumer development;
- provider and consumer contract tests.

Recommended event topics:

```text
factory.status.changed
service.health.changed
job.created
job.status.changed
worker.run.changed
worker.heartbeat.stale
review.queue.changed
evidence.updated
validation.gate.updated
merge.gate.updated
approval.packet.updated
decision.alert.created
decision.alert.acknowledged
budget.capacity.changed
audit.event.created
```

The first release may use polling where event infrastructure is incomplete, provided the UI clearly displays refresh and freshness metadata.

### Parent 4 — Implement the Command Center read model in AIF Core

**Priority:** P0  
**Primary owner:** AIF Core  
**Repository:** `tpcm-ai-factory`

Build safe server-side projections that convert current internal state into the versioned Command Center contracts.

Required work:

- aggregate Factory status without requiring the UI to understand internal stores;
- expose service and runtime health;
- expose jobs, queues, worker runs, heartbeats, stale and blocked states;
- normalize review, evidence, validation, merge, approval, and alert data;
- expose compact audit events;
- expose budget and capacity summaries;
- resolve GitHub issue and PR references server-side where needed;
- redact secrets, local paths, tokens, and unsafe log content;
- prevent unrestricted file-system access through API parameters;
- implement authorization at the API boundary;
- add API schema validation and contract tests;
- add endpoint-level operational telemetry.

Core should expose operational summaries, not internal data-file structure.

### Parent 5 — Bootstrap the `aif-cc` repository and engineering baseline

**Priority:** P0  
**Primary owner:** Command Center engineering  
**Repository:** `aif-cc`

Required repository foundation:

```text
README.md
CONTRIBUTING.md
SECURITY.md
CODEOWNERS
LICENSE or internal-use notice
docs/architecture/
docs/plan/
docs/runbooks/
src/
tests/
.github/workflows/
```

Select and document the application stack using an ADR. The stack should support:

- typed API clients;
- component-based UI development;
- route-level code organization;
- server-side or secure proxy handling where needed;
- accessible data tables and interaction patterns;
- contract fixture testing;
- end-to-end testing;
- preview and production builds;
- secure runtime configuration.

Engineering baseline:

- formatting and linting;
- strict type checking;
- unit and component tests;
- end-to-end smoke tests;
- dependency and secret scanning;
- pull-request build checks;
- preview deployments;
- protected default branch;
- required reviews and status checks;
- conventional change and release notes;
- environment-variable validation;
- no privileged token in client-side bundles.

### Parent 6 — Build the mock-first application shell and design system

**Priority:** P1  
**Primary owner:** Command Center frontend/product  
**Repository:** `aif-cc`

Build against versioned, sanitized contract fixtures before live Core APIs are complete.

Required primary routes:

```text
/home
/mission-board
```

Recommended navigation destinations:

```text
/workers
/jobs
/reviews
/evidence
/approvals
/gates
/costs
/infrastructure
/audit
```

Some destinations may initially be filtered views or deep links from `/mission-board`.

Shared product shell:

- left navigation rail;
- top utility and Factory-status strip;
- global refresh and freshness indication;
- authenticated operator identity;
- environment badge;
- connection status;
- consistent page title and breadcrumb behavior;
- accessible keyboard navigation;
- responsive layout.

Shared components:

```text
StatusBadge
FreshnessIndicator
FactorySummary
ServiceHealthCard
JobCard
WorkerRunTable
WorkerRunDetail
ReviewQueueCard
EvidenceSummary
GateSummary
ApprovalPacketCard
DecisionAlertCard
CostCapacityPanel
AuditTimeline
SourceLink
EmptyState
PartialDataWarning
ErrorPanel
```

Required normalized states:

```text
PASS
WARN
FAIL
BLOCKED
STALE
UNKNOWN
SAMPLE
```

Worker states:

```text
queued
assigned
running
blocked
stale
done
failed
cancelled
```

Truthfulness rules:

- missing, unreadable, malformed, or unavailable data becomes `UNKNOWN`;
- fixtures and demonstrations are always labelled `SAMPLE`;
- cost is `ESTIMATED` unless backed by actual usage or billing records;
- worker activity is live only when supported by worker-run and heartbeat evidence;
- refresh failure preserves the last known state and marks it stale or warning;
- decorative animation must never imply unverified live work.

### Parent 7 — Implement `/home` as the five-second executive cockpit

**Priority:** P1  
**Primary owner:** Command Center product/frontend

`/home` must quickly answer:

```text
Is AIF Core reachable?
Is the Factory healthy?
Are workers active?
Is anything blocked or stale?
Is human approval required?
Are validation or merge gates failing?
What is today's estimated or actual AI cost?
What changed most recently?
```

Recommended panels:

- Factory pulse and overall state;
- service/runtime health;
- active, blocked, stale, and failed worker counts;
- approvals and decision-required alerts;
- validation and merge-gate summary;
- daily cost and capacity summary;
- latest critical operational event;
- quick links to focused Mission Board filters.

The page may use a restrained cinematic JAVIS visual language, but status text and operational truth must remain primary.

### Parent 8 — Implement `/mission-board` and operational drill-down

**Priority:** P1  
**Primary owner:** Command Center product/frontend

Required capabilities:

- dense, stable work table or card view;
- filters by status, team, worker, issue, repository, and freshness;
- stale-only, blocked-only, approval-required, and failed-gate filters;
- current step, output target, last heartbeat, and next action;
- linked issue, PR, evidence, report, gate, and approval context;
- expandable detail without exposing unrestricted raw logs;
- copyable compact status report;
- URL-addressable filters for sharing operator views;
- pagination or virtualization for larger queues;
- consistent empty, partial, and failure states.

The operator should be able to identify:

```text
TEAM
WORKER
ISSUE_OR_JOB
TASK
STATUS
CURRENT_STEP
LAST_HEARTBEAT
OUTPUT_TARGET
PR_OR_REPORT
BLOCKER
NEXT_ACTION
```

### Parent 9 — Connect live read-only operational slices

**Priority:** P1  
**Primary owners:** AIF Core integration and Command Center frontend

Implement live integration as vertical slices. Each slice should include Core API support, typed client support, UI, errors, freshness, tests, and acceptance evidence.

#### Slice A — Factory and service health

- Factory aggregate state;
- AIF Core readiness;
- Operator Bridge health;
- scheduler/control-loop state;
- database and required dependency health;
- last successful control-loop cycle;
- partial outage behavior.

#### Slice B — Jobs, workers, queues, and blockers

- active and recent jobs;
- worker queues;
- worker run registry;
- heartbeat freshness;
- current step and output target;
- blocked, stale, failed, and cancelled states;
- issue and report references.

#### Slice C — Review and GitHub work

- review queue;
- issue and pull-request links;
- CI/check summary where available;
- reviewer state;
- mergeability information as observation only;
- no direct browser merge mutation.

#### Slice D — Evidence and gates

- evidence requests and results;
- compact evidence summaries;
- validation-gate state;
- merge-gate state;
- relevant head SHA and freshness;
- explicit changed/stale packet warnings.

#### Slice E — Approvals and decision alerts

- pending approval packets;
- expired, superseded, or stale packet state;
- decision-required alerts;
- responsible operator or role;
- audit references;
- observation only in the first release.

#### Slice F — Audit and event timeline

- append-only compact events;
- correlation across jobs, workers, evidence, gates, and approvals;
- filters by severity, type, actor, and time;
- redacted details;
- links to source objects;
- no unbounded raw-log viewer by default.

#### Slice G — Cost, model usage, and capacity

- today/session/task views where supported;
- team, worker, provider, and model breakdown;
- estimated versus actual labeling;
- token and request counts;
- budget warnings;
- Codex/worker capacity status;
- unavailable provider data shown as `UNKNOWN`.

### Parent 10 — Add trusted-operator authentication and authorization

**Priority:** P1 before production  
**Primary owners:** Security, AIF Core, Command Center platform

Required controls:

- authenticated access to every non-public route;
- server-side session management or another approved secure model;
- operator identities and roles;
- least-privilege scopes;
- explicit environment separation;
- secure logout and session expiration;
- CSRF and CORS controls where applicable;
- rate limiting and abuse protection;
- authorization enforced by AIF Core, not only hidden in UI;
- no administrative GitHub or Core token in browser storage or bundles;
- audit records for authentication and later action requests.

Initial roles may be:

```text
observer
operator
approver
admin
```

For the read-only release, most users should require only `observer` scope.

### Parent 11 — Implement resilience, freshness, and observability

**Priority:** P1  
**Primary owner:** Command Center platform

Required behavior:

- clear last-refreshed and source-observed timestamps;
- per-panel loading, error, partial, stale, and disconnected states;
- last-known state preservation during temporary failure;
- bounded retry with backoff;
- no optimistic display of worker execution;
- event reconnect and resynchronization behavior;
- correlation IDs surfaced for support without leaking internals;
- structured frontend and API-client telemetry;
- error reporting with secret redaction;
- synthetic health checks for deployed environments;
- performance budgets for initial load and refresh.

Recommended refresh defaults:

```text
/home summary: 30 seconds
/mission-board: 60 seconds
manual refresh: always available
critical event stream: near-real-time where supported
```

Core-provided freshness policy should override UI assumptions.

### Parent 12 — Establish QA, accessibility, security, and safety gates

**Priority:** P1  
**Primary owners:** QA/release, security, Command Center engineering

Required automated coverage:

- unit tests for normalization and status derivation;
- component tests for all operational states;
- provider and consumer API contract tests;
- integration tests with sanitized fixtures;
- end-to-end tests for `/home` and `/mission-board`;
- partial API failure tests;
- stale heartbeat tests;
- authentication and authorization tests;
- accessibility tests and keyboard navigation;
- reduced-motion behavior;
- responsive viewport tests;
- dependency, code, and secret scanning;
- production bundle checks for embedded credentials;
- performance and large-list tests.

Required negative safety tests must prove the UI cannot:

- execute shell commands;
- merge a PR directly;
- deploy directly;
- mutate branches;
- bypass Core validation or approval gates;
- read arbitrary local files;
- expose tokens, environment variables, or secrets;
- mark work as running without worker-run evidence;
- display fixtures as live data.

Release gate template:

```text
DECISION=PASS|FIX|BLOCK
CONTRACT_TESTS=PASS|FAIL
END_TO_END=PASS|FAIL
ACCESSIBILITY=PASS|FAIL
SECURITY=PASS|FAIL
READ_ONLY_SAFETY=PASS|FAIL
TRUTHFULNESS_STATES=PASS|FAIL
FRESHNESS_BEHAVIOR=PASS|FAIL
REASON=
NEXT_ACTION=
```

### Parent 13 — Deploy, pilot, and cut over from the in-core console

**Priority:** P1  
**Primary owners:** Infra/DevOps, Command Center product, AIF Core

Deployment stages:

```text
local development
pull-request preview
shared development
staging/operator acceptance
production
```

Cutover sequence:

1. Deploy the authenticated `aif-cc` staging environment.
2. Connect it to the approved non-production Core API.
3. Run parity and safety tests.
4. Conduct operator acceptance with Izu/JAVIS Ops.
5. Run the new and old consoles side by side.
6. Resolve parity blockers and document accepted differences.
7. Switch operator documentation and bookmarks to `aif-cc`.
8. Freeze new product UI work in `tpcm-ai-factory/apps/web-console`.
9. Retain only explicitly approved Core diagnostics.
10. Remove or archive direct local-data product coupling after rollback criteria expire.

Required runbooks:

- deployment and rollback;
- authentication incident;
- Core API unavailable;
- event stream unavailable;
- stale or contradictory Factory state;
- secret exposure response;
- incorrect cost data;
- Command Center/Core contract mismatch;
- production smoke test.

### Parent 14 — Add bounded operator actions after read-only stabilization

**Priority:** P2  
**Primary owners:** AIF Core safety, Command Center product/security

This parent must not block the read-only release and must not be implemented as direct UI-side execution.

Candidate bounded requests:

```text
request evidence
rerun a safe health check
request validation-gate evaluation
request merge-gate report
acknowledge a decision alert
submit approve_merge through approved intake
submit request_fix through approved intake
submit block through approved intake
request a bounded worker/Codex fix loop
```

Every action must include:

- authenticated actor;
- authorized scope;
- target and exact requested operation;
- current object version or head SHA where relevant;
- idempotency key;
- expiration time;
- human-readable confirmation;
- Core-side revalidation;
- accepted/rejected status;
- correlation ID;
- append-only audit event;
- result and failure state;
- protection against double submission and stale decisions.

AIF Core must remain free to reject any request because state, authorization, policy, evidence, validation, merge gates, or runtime safety changed.

## 7. Recommended GitHub issue hierarchy

Create one umbrella issue in `tpcmUAE/aif-cc`:

> Parent: AIF Command Center v0 — live, read-only operator cockpit

Recommended child parent issues:

```text
P0 Architecture, repository identity, and ownership
P0 Transitional-console inventory and parity baseline
P0 Core-to-Command-Center API/event contract v0
P0 AIF Core read-model APIs
P0 aif-cc repository and CI foundation
P1 Mock-first shell and operational design system
P1 /home executive cockpit
P1 /mission-board operational workflow
P1 Live operational integration slices
P1 Trusted-operator authentication and authorization
P1 Freshness, resilience, and observability
P1 QA, accessibility, security, and safety gates
P1 Deployment, pilot, and core-console cutover
P2 Audited bounded operator actions
```

Cross-repository implementation issues should live in the repository that owns the change and be linked as blockers or dependencies rather than duplicating ownership.

## 8. Dependency order

```text
Architecture decision
        |
        v
Inventory and v0 parity baseline
        |
        v
Core API/event contract v0
        |
        +--------------------+
        v                    v
Core read-model APIs    aif-cc repository bootstrap
        |                    |
        |                    v
        |              Mock-first UI and fixtures
        +--------------------+
                             v
                    Live read-only integrations
                             |
                  +----------+----------+
                  v                     v
         Authentication/security   Resilience/freshness
                  +----------+----------+
                             v
                    QA and safety gate
                             |
                             v
                   Deploy, pilot, cut over
                             |
                             v
                Bounded operator actions
```

Core API implementation and mock-first UI work can proceed in parallel after the contract and fixtures are stable.

## 9. Definition of done for Command Center v0

Command Center v0 is complete only when:

1. `aif-cc` is separately built and deployed.
2. All protected routes require authenticated operator access.
3. `/home` provides a truthful five-second Factory summary.
4. `/mission-board` shows who is working, on what, current step, heartbeat, output, blocker, link, and next action.
5. Factory, service, job, worker, review, evidence, gate, approval, alert, audit, cost, and capacity views use stable AIF Core contracts.
6. Every panel shows source, observation time, refresh time, and freshness.
7. Live, stale, sample, estimated, actual, partial, and unknown data are visually and semantically distinct.
8. Missing data never appears healthy or active.
9. No privileged token is shipped to the browser.
10. The UI cannot directly merge, deploy, run shell, mutate branches, or bypass gates.
11. Contract, end-to-end, accessibility, security, and safety tests pass.
12. Operator acceptance is recorded.
13. Deployment and rollback runbooks are tested.
14. The in-core web console is no longer the primary Command Center product UI.
15. Remaining in-core diagnostic surfaces are explicitly documented.

## 10. Initial non-goals

The following are not required for the first read-only release:

- arbitrary shell or terminal access;
- direct merge or deployment controls;
- full raw-log browsing;
- public/customer access;
- AIF Studio builder workflows;
- agent Marketplace workflows;
- mobile-native UI;
- billing or purchasing flows;
- changing scheduler or worker policy from the browser;
- making GitHub the permanent internal database of Command Center;
- replacing AIF Core safety decisions with frontend validation.

## 11. Delivery recommendations

### Use vertical slices

Do not build all backend endpoints first and all UI later. After the contract foundation, complete one operational slice at a time with:

```text
Core projection
API schema
fixture
client type
UI
empty/error/stale states
tests
operator acceptance evidence
```

### Keep pull requests small and reviewable

Recommended PR grouping:

- repository foundation;
- contract fixtures and typed client;
- shell/design-system primitives;
- one route or operational slice per PR;
- security changes isolated for focused review;
- deployment and infrastructure changes isolated from UI polish.

### Preserve the safety boundary in code ownership

Changes touching the following should require AIF Core/security review:

```text
authentication
authorization
action request contracts
approval intake
merge decisions
validation or merge gates
secret redaction
audit records
Core API policies
```

### Reserve high-end Codex capacity for high-risk work

Use highest-reasoning capacity for:

- API and event boundaries;
- authorization and action policy;
- approval and merge-decision intake;
- redaction and safety guardrails;
- contract compatibility and hard blockers.

Use normal implementation capacity for:

- product UI;
- ordinary API-client integration;
- components and responsive layouts;
- tests and documentation;
- mock data and low-risk scaffolding.

## 12. First recommended execution batch

The first batch should create the foundation needed for parallel Core and Command Center work:

```text
1. Approve the architecture and canonical repo decision.
2. Produce the transitional-console inventory and parity checklist.
3. Draft and approve Core API/event contract v0.
4. Add sanitized contract fixtures to aif-cc.
5. Bootstrap the aif-cc app, CI, tests, and preview deployment.
6. Implement the shell, status system, /home, and /mission-board against fixtures.
7. Implement the first live vertical slice: Factory and service health.
8. Prove contract testing between Core and aif-cc.
```

This batch should end with a deployable, authenticated preview that can switch between fixture mode and the first live Core health data without direct access to Core-local files.

## 13. Source references

This plan is based on the strategy and existing implementation in `tpcmUAE/tpcm-ai-factory`, especially:

```text
docs/strategy/aif-business-model-v2.md
docs/strategy/aif-business-model-v2-command-center.md
docs/strategy/aif-business-model-v2-factory-core.md
docs/command-center-ui-spec.md
apps/web-console/
Issue #136
Issue #141
Issue #374
PR #150
```

Those sources remain the strategic and functional baseline until replaced by approved architecture decisions and versioned Core contracts in the new repository.
