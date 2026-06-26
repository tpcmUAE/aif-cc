import { FormEvent, useMemo, useState } from "react";
import { answerOperatorQuery, factoryStatus } from "./operator";
import type { OperatorResponse } from "./types";

const EXAMPLE_QUERIES = [
  "What is the Factory health?",
  "Show blocked jobs.",
  "What PRs need review?",
  "Summarize latest evidence packets.",
  "What needs my attention?",
];

const BLOCKED_EXAMPLE = "Merge PR 373.";

export default function App() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);
  const [response, setResponse] = useState<OperatorResponse>(() =>
    answerOperatorQuery(EXAMPLE_QUERIES[0]),
  );

  const stats = useMemo(
    () => ({
      services: factoryStatus.factory_health.services.length,
      jobs: factoryStatus.jobs.length,
      blockedJobs: factoryStatus.jobs.filter((job) => job.state === "blocked").length,
      prs: factoryStatus.pull_requests.filter((pr) => pr.needs_review).length,
      evidence: factoryStatus.evidence_packets.length,
      attention: factoryStatus.attention_items.length,
    }),
    [],
  );

  function submitQuery(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setResponse(answerOperatorQuery(query));
  }

  function runExample(example: string) {
    setQuery(example);
    setResponse(answerOperatorQuery(example));
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">AIF Command Center</p>
          <h1>Read-only Factory operator</h1>
          <p className="hero-copy">
            Phase 1 proves the shared text operator core before adding local
            push-to-talk STT and local TTS adapters.
          </p>
        </div>
        <div className="status-card">
          <span className={`status-pill status-${factoryStatus.factory_health.status}`}>
            {factoryStatus.factory_health.status}
          </span>
          <strong>{factoryStatus.factory_health.summary}</strong>
          <small>Source: {factoryStatus.source} data</small>
        </div>
      </section>

      <section className="grid metrics-grid" aria-label="Factory status metrics">
        <Metric label="Services" value={stats.services} />
        <Metric label="Jobs" value={stats.jobs} />
        <Metric label="Blocked" value={stats.blockedJobs} tone="warning" />
        <Metric label="PR Reviews" value={stats.prs} />
        <Metric label="Evidence" value={stats.evidence} />
        <Metric label="Attention" value={stats.attention} tone="urgent" />
      </section>

      <section className="workspace-grid">
        <div className="panel operator-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Text-first core</p>
              <h2>Ask a status question</h2>
            </div>
            <span className="readonly-badge">Read-only MVP</span>
          </div>

          <form onSubmit={submitQuery} className="query-form">
            <label htmlFor="operator-query">Operator query</label>
            <textarea
              id="operator-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={4}
              placeholder="Ask about health, blocked jobs, PRs, evidence, or attention items."
            />
            <button type="submit">Ask Command Center</button>
          </form>

          <div className="examples">
            <p>Try:</p>
            {EXAMPLE_QUERIES.map((example) => (
              <button type="button" key={example} onClick={() => runExample(example)}>
                {example}
              </button>
            ))}
            <button
              type="button"
              className="blocked-example"
              onClick={() => runExample(BLOCKED_EXAMPLE)}
            >
              Safety test: {BLOCKED_EXAMPLE}
            </button>
          </div>
        </div>

        <div className="panel response-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operator response</p>
              <h2>{response.title}</h2>
            </div>
            <span className="intent-badge">{response.intent}</span>
          </div>

          <p className="summary">{response.summary}</p>

          {response.details.length > 0 ? (
            <ul className="details-list">
              {response.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}

          {response.safetyNote ? (
            <div className="safety-note">
              <strong>Safety:</strong> {response.safetyNote}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel voice-placeholder">
        <div>
          <p className="eyebrow">Voice adapters</p>
          <h2>Local STT/TTS intentionally not enabled yet</h2>
          <p>
            Next phase adds push-to-talk local STT and optional local TTS as
            adapters around this same operator core. Text mode stays permanent
            for safe debugging.
          </p>
        </div>
        <div className="voice-flow">
          <span>Text query</span>
          <span>→</span>
          <span>Shared core</span>
          <span>→</span>
          <span>Read-only response</span>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "urgent";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
