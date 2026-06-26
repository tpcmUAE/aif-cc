export type StatusLevel = "ok" | "warning" | "critical" | "unknown";
export type JobState = "queued" | "running" | "blocked" | "completed" | "failed";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type PullRequestState = "open" | "draft" | "blocked" | "ready" | "merged" | "closed";
export type EvidenceState = "pending" | "available" | "failed" | "stale";
export type Severity = "info" | "warning" | "urgent";

export interface FactoryService {
  name: string;
  status: StatusLevel;
  last_checked_at: string;
  details?: string;
}

export interface FactoryHealth {
  status: Exclude<StatusLevel, "unknown">;
  summary: string;
  services: FactoryService[];
}

export interface FactoryJob {
  id: string;
  title: string;
  state: JobState;
  priority: Priority;
  owner: string;
  blocked_reason: string | null;
  updated_at: string;
}

export interface FactoryPullRequest {
  number: number;
  repo: string;
  title: string;
  state: PullRequestState;
  needs_review: boolean;
  risk: "low" | "medium" | "high";
  summary: string;
}

export interface EvidencePacket {
  id: string;
  title: string;
  state: EvidenceState;
  related_repo: string;
  related_issue: number;
  summary: string;
  updated_at: string;
}

export interface AttentionItem {
  id: string;
  severity: Severity;
  title: string;
  summary: string;
  recommended_next_step: string;
}

export interface FactoryStatusSnapshot {
  generated_at: string;
  source: "sample" | "factory_api";
  factory_health: FactoryHealth;
  jobs: FactoryJob[];
  pull_requests: FactoryPullRequest[];
  evidence_packets: EvidencePacket[];
  attention_items: AttentionItem[];
}

export type OperatorIntent =
  | "factory_health"
  | "blocked_jobs"
  | "prs_needing_review"
  | "evidence_summary"
  | "attention_summary"
  | "unsupported_action"
  | "unknown";

export interface OperatorResponse {
  intent: OperatorIntent;
  title: string;
  summary: string;
  details: string[];
  safetyNote?: string;
}
