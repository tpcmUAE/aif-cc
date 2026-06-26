# Factory Status Read-Only Contract v0

Repository: `tpcmUAE/aif-cc`  
Purpose: draft shape for Command Center read-only status data  
Status: draft contract for mock/sample implementation

## Purpose

This contract defines the first read-only data shape that Command Center can use before live Factory APIs are finalized.

It is intentionally read-only and status-oriented.

## Boundary

Command Center can read this data and summarize it.

Command Center must not use this contract to execute actions.

Forbidden through this contract:

- Starting jobs.
- Approving jobs.
- Merging PRs.
- Deploying.
- Mutating branches.
- Running shell commands.
- Reading secrets.

## Top-level shape

```json
{
  "generated_at": "2026-06-26T09:30:00Z",
  "source": "sample",
  "factory_health": {},
  "jobs": [],
  "pull_requests": [],
  "evidence_packets": [],
  "attention_items": []
}
```

## factory_health

```json
{
  "status": "ok | warning | critical",
  "summary": "Short human-readable summary",
  "services": [
    {
      "name": "operator-bridge",
      "status": "ok | warning | critical | unknown",
      "last_checked_at": "2026-06-26T09:30:00Z",
      "details": "Optional short detail"
    }
  ]
}
```

## jobs

```json
{
  "id": "job-001",
  "title": "Review PR 373 bootstrap fix",
  "state": "queued | running | blocked | completed | failed",
  "priority": "P0 | P1 | P2 | P3",
  "owner": "JAVIS Ops | CTO | Codex | Human",
  "blocked_reason": "Optional reason",
  "updated_at": "2026-06-26T09:30:00Z"
}
```

## pull_requests

```json
{
  "number": 373,
  "repo": "tpcmUAE/tpcm-ai-factory",
  "title": "Preserve repo venv path during runtime checks",
  "state": "open | draft | blocked | ready | merged | closed",
  "needs_review": true,
  "risk": "low | medium | high",
  "summary": "Short review status"
}
```

## evidence_packets

```json
{
  "id": "evidence-001",
  "title": "Service bootstrap proof",
  "state": "pending | available | failed | stale",
  "related_repo": "tpcmUAE/tpcm-ai-factory",
  "related_issue": 372,
  "summary": "Short evidence summary",
  "updated_at": "2026-06-26T09:30:00Z"
}
```

## attention_items

```json
{
  "id": "attention-001",
  "severity": "info | warning | urgent",
  "title": "Bootstrap proof blocked",
  "summary": "Runtime check is using system Python instead of repo venv.",
  "recommended_next_step": "Review PR 373 before closing issue 372."
}
```

## Supported read-only intents

Command Center should map the following operator questions to this contract:

| Intent | Data used |
|---|---|
| Factory health | `factory_health` |
| Blocked jobs | `jobs[state=blocked]` |
| PRs needing review | `pull_requests[needs_review=true]` |
| Evidence summary | `evidence_packets` |
| Attention summary | `attention_items` |

## Unsupported intents

Any command that changes state must be refused in this MVP.

Examples:

- Merge a PR.
- Start a job.
- Approve an action.
- Deploy a service.
- Run a command.
- Edit a repository.

## Future API direction

Later, this sample contract can map to Factory Core endpoints such as:

```text
GET /health
GET /jobs
GET /review-queue
GET /evidence
GET /attention
```

All write/action endpoints must remain separate and guarded by Factory approval rules.
