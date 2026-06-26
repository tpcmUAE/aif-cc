# Read-Only Local Voice Operator Prototype v1

Repository: `tpcmUAE/aif-cc`  
Related issue: #1  
Status: planning baseline  
Safety level: read-only MVP

## Goal

Build the first Command Center voice prototype as a local-first, read-only operator surface.

The prototype should allow an operator to ask simple Factory status questions by text first, then push-to-talk voice, and receive a deterministic response as text plus optional local TTS.

## Principle

Voice must be an adapter around one shared operator core.

```text
Typed query
Push-to-talk transcript
Future proactive notice
        ↓
Shared operator core
        ↓
Read-only status/query handlers
        ↓
Text response
Optional local TTS response
```

Do not build separate business logic for voice.

## MVP flow

```text
Operator opens Command Center
        ↓
Operator types or speaks a read-only query
        ↓
Input is normalized to text
        ↓
Operator core classifies the query intent
        ↓
Read-only sample/live Factory status data is queried
        ↓
A concise status response is shown
        ↓
If local TTS is enabled, the response is spoken
```

## Supported MVP questions

The first version should support only read-only questions:

- `What is the Factory health?`
- `Show blocked jobs.`
- `What PRs need review?`
- `Summarize latest evidence packets.`
- `What needs my attention?`

If the user asks for a write/action command, the prototype must refuse or mark it as unsupported.

Examples of unsupported commands:

- `Merge this PR.`
- `Deploy this.`
- `Run this shell command.`
- `Approve this job.`
- `Start the worker.`

## Proposed implementation phases

### Phase 1 — text-first operator core

Deliverables:

- Basic input panel or CLI-style query path.
- Query normalization.
- Deterministic read-only intent handling.
- Sample Factory status data source.
- Text response renderer.

Verification:

- Operator can ask all supported MVP questions via text.
- Unsupported write/action requests are blocked.

### Phase 2 — local STT adapter

Deliverables:

- Push-to-talk audio capture.
- Local STT provider seam.
- Whisper-compatible local runner option.
- Transcript display.
- Transcript passed into the same text operator core.

Verification:

- Operator can ask one supported query by voice.
- Transcript is visible.
- Text path still works.

### Phase 3 — local TTS adapter

Deliverables:

- Local TTS provider seam.
- Kokoro/Piper/local equivalent option.
- Text response remains visible.
- TTS can be disabled without breaking the app.

Verification:

- Operator hears a spoken response for a supported query.
- If TTS is unavailable, app remains usable in text mode.

### Phase 4 — Command Center UI proof

Deliverables:

- Simple operator panel.
- Input area.
- Transcript area.
- Response area.
- Source/status card showing whether data is sample or live.
- Safety boundary notice.

Verification:

- Demo three end-to-end read-only queries.
- Confirm no write/action capability exists.

## Data strategy

Until Factory Core exposes stable APIs, use sample data that mirrors expected Factory status shapes.

Initial sample file:

```text
samples/factory-status.sample.json
```

The sample should model:

- Factory health.
- Jobs.
- Blocked jobs.
- PRs needing review.
- Evidence packets.
- Attention items.

Later, replace sample provider with a Factory API provider through a read-only seam.

## Provider seams

The implementation should avoid hardwiring engines.

```text
InputProvider
  - text
  - push_to_talk_local_stt

StatusProvider
  - sample_json
  - factory_api_readonly

OutputProvider
  - text
  - local_tts
```

## Safety boundary

The MVP must not include:

- Shell execution.
- Git merge.
- Deploy.
- Branch mutation.
- Secret access.
- Approval execution.
- Job execution.
- Direct Factory internals access.

All future consequential actions require separate issues and explicit Factory approval gates.

## Acceptance checklist

- [ ] Text-only query mode works.
- [ ] Supported read-only questions return useful answers.
- [ ] Unsupported write/action commands are blocked.
- [ ] Sample data source exists.
- [ ] STT provider seam exists.
- [ ] Push-to-talk transcript is visible.
- [ ] TTS provider seam exists.
- [ ] Text mode works when STT/TTS are unavailable.
- [ ] README documents safety boundaries.
- [ ] No write/action capability introduced.

## Non-goals

- Wake word.
- Always-on mic.
- Cloud-only STT/TTS dependency.
- Production authentication.
- Real merge/deploy/approval execution.
- Studio or Marketplace integration.
- Agent building.

## CTO recommendation

Start with Phase 1 only. Do not add audio until the text operator core is deterministic and testable.
