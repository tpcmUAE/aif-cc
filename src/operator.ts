import sampleStatus from "../samples/factory-status.sample.json";
import type {
  FactoryStatusSnapshot,
  OperatorIntent,
  OperatorResponse,
} from "./types";

export const factoryStatus = sampleStatus as FactoryStatusSnapshot;

const ACTION_KEYWORDS = [
  "approve",
  "merge",
  "deploy",
  "delete",
  "remove",
  "run command",
  "shell",
  "execute",
  "start job",
  "start worker",
  "stop worker",
  "mutate",
  "push",
  "commit",
  "secret",
];

export function classifyOperatorIntent(query: string): OperatorIntent {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return "unknown";
  }

  if (ACTION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "unsupported_action";
  }

  if (
    normalized.includes("health") ||
    normalized.includes("status") ||
    normalized.includes("factory")
  ) {
    return "factory_health";
  }

  if (normalized.includes("blocked") || normalized.includes("blocker")) {
    return "blocked_jobs";
  }

  if (
    normalized.includes("pr") ||
    normalized.includes("pull request") ||
    normalized.includes("review")
  ) {
    return "prs_needing_review";
  }

  if (
    normalized.includes("evidence") ||
    normalized.includes("proof") ||
    normalized.includes("packet")
  ) {
    return "evidence_summary";
  }

  if (
    normalized.includes("attention") ||
    normalized.includes("urgent") ||
    normalized.includes("what needs") ||
    normalized.includes("focus")
  ) {
    return "attention_summary";
  }

  return "unknown";
}

export function answerOperatorQuery(
  query: string,
  snapshot: FactoryStatusSnapshot = factoryStatus,
): OperatorResponse {
  const intent = classifyOperatorIntent(query);

  switch (intent) {
    case "factory_health":
      return answerFactoryHealth(snapshot);
    case "blocked_jobs":
      return answerBlockedJobs(snapshot);
    case "prs_needing_review":
      return answerPullRequests(snapshot);
    case "evidence_summary":
      return answerEvidence(snapshot);
    case "attention_summary":
      return answerAttention(snapshot);
    case "unsupported_action":
      return {
        intent,
        title: "Action blocked in read-only prototype",
        summary:
          "This Command Center prototype can only answer read-only status questions. It cannot execute, approve, merge, deploy, or mutate anything.",
        details: [
          "Use this MVP for monitoring only.",
          "Any future write/action flow must go through explicit Factory approval gates.",
        ],
        safetyNote:
          "Blocked by design: no shell, merge, deploy, approval execution, job execution, or secret access is available in this prototype.",
      };
    case "unknown":
    default:
      return {
        intent: "unknown",
        title: "Ask a read-only Factory status question",
        summary:
          "I can summarize health, blocked jobs, PRs needing review, evidence packets, or attention items from the sample Factory status data.",
        details: [
          "Try: What is the Factory health?",
          "Try: Show blocked jobs.",
          "Try: What PRs need review?",
          "Try: Summarize latest evidence packets.",
          "Try: What needs my attention?",
        ],
      };
  }
}

function answerFactoryHealth(snapshot: FactoryStatusSnapshot): OperatorResponse {
  const health = snapshot.factory_health;
  const serviceLines = health.services.map(
    (service) =>
      `${service.name}: ${service.status}${service.details ? ` — ${service.details}` : ""}`,
  );

  return {
    intent: "factory_health",
    title: `Factory health: ${health.status.toUpperCase()}`,
    summary: health.summary,
    details: serviceLines,
    safetyNote: "Read-only sample data. No Factory action was executed.",
  };
}

function answerBlockedJobs(snapshot: FactoryStatusSnapshot): OperatorResponse {
  const blockedJobs = snapshot.jobs.filter((job) => job.state === "blocked");

  if (blockedJobs.length === 0) {
    return {
      intent: "blocked_jobs",
      title: "No blocked jobs",
      summary: "There are no blocked jobs in the current status snapshot.",
      details: [],
      safetyNote: "Read-only sample data. No Factory action was executed.",
    };
  }

  return {
    intent: "blocked_jobs",
    title: `${blockedJobs.length} blocked job${blockedJobs.length === 1 ? "" : "s"}`,
    summary: "The following jobs need attention before they can proceed.",
    details: blockedJobs.map(
      (job) =>
        `${job.priority} ${job.title} — owner: ${job.owner}; reason: ${job.blocked_reason ?? "not specified"}`,
    ),
    safetyNote: "Read-only sample data. No job was started or modified.",
  };
}

function answerPullRequests(snapshot: FactoryStatusSnapshot): OperatorResponse {
  const prs = snapshot.pull_requests.filter((pr) => pr.needs_review);

  if (prs.length === 0) {
    return {
      intent: "prs_needing_review",
      title: "No PRs need review",
      summary: "There are no pull requests marked as needing review in the current snapshot.",
      details: [],
      safetyNote: "Read-only sample data. No PR action was executed.",
    };
  }

  return {
    intent: "prs_needing_review",
    title: `${prs.length} PR${prs.length === 1 ? "" : "s"} need review`,
    summary: "These pull requests are waiting for CTO/operator attention.",
    details: prs.map(
      (pr) =>
        `${pr.repo}#${pr.number}: ${pr.title} — state: ${pr.state}; risk: ${pr.risk}; ${pr.summary}`,
    ),
    safetyNote: "Read-only sample data. No merge, label, or branch action was executed.",
  };
}

function answerEvidence(snapshot: FactoryStatusSnapshot): OperatorResponse {
  const packets = snapshot.evidence_packets;

  if (packets.length === 0) {
    return {
      intent: "evidence_summary",
      title: "No evidence packets",
      summary: "There are no evidence packets in the current snapshot.",
      details: [],
      safetyNote: "Read-only sample data. No evidence request was executed.",
    };
  }

  return {
    intent: "evidence_summary",
    title: `${packets.length} evidence packet${packets.length === 1 ? "" : "s"}`,
    summary: "Latest evidence packet status from the sample Factory snapshot.",
    details: packets.map(
      (packet) =>
        `${packet.title} — ${packet.state}; repo: ${packet.related_repo}; issue: #${packet.related_issue}; ${packet.summary}`,
    ),
    safetyNote: "Read-only sample data. No evidence collection was triggered.",
  };
}

function answerAttention(snapshot: FactoryStatusSnapshot): OperatorResponse {
  const items = snapshot.attention_items;

  if (items.length === 0) {
    return {
      intent: "attention_summary",
      title: "No attention items",
      summary: "There are no attention items in the current snapshot.",
      details: [],
      safetyNote: "Read-only sample data. No Factory action was executed.",
    };
  }

  return {
    intent: "attention_summary",
    title: `${items.length} attention item${items.length === 1 ? "" : "s"}`,
    summary: "These are the current operator focus items.",
    details: items.map(
      (item) =>
        `${item.severity.toUpperCase()}: ${item.title} — ${item.summary} Next: ${item.recommended_next_step}`,
    ),
    safetyNote: "Read-only sample data. No Factory action was executed.",
  };
}
