# AIF Command Center

AIF Command Center (`aif-cc`) is the internal operator cockpit for watching, understanding, and safely steering the AI Factory.

This repository is a product/client layer. It must not become the Factory runtime, scheduler, worker engine, merge gate, deploy engine, or local shell executor.

## Current focus

The first implementation track is issue #1:

**P1: Build read-only local voice operator prototype for Command Center**

The prototype proves a local-first JAVIS-style operator surface:

```text
Text or push-to-talk input
  -> operator intent/query
  -> read-only Factory status data
  -> text response
  -> optional local text-to-speech output
```

## Safety boundary

Command Center may display Factory state and request bounded actions through approved Factory APIs.

For the first voice prototype, Command Center must remain read-only.

Forbidden in the MVP:

- No shell execution.
- No Git merge.
- No deploy.
- No branch mutation.
- No secret access.
- No approval decision execution.
- No job execution.
- No direct calls into local Factory internals.

Any future write/action capability must be a separate issue and must go through explicit Factory approval gates.

## Product direction

Command Center should eventually provide:

- Factory health dashboard.
- Jobs and queue monitor.
- Blocked work view.
- Evidence packet inbox.
- PR/review queue visibility.
- Approval packet viewer.
- Safe operator query panel.
- Optional local voice input/output.

## Voice direction

Voice is an adapter, not the core logic.

```text
Text input, push-to-talk input, and future proactive notices
  -> same operator core
  -> same read-only status/query handlers
```

The MVP should preserve text-only mode forever because it is the safest debug path.

Preferred local-first direction:

- Local STT provider seam: Whisper-compatible local runner such as `whisper.cpp`.
- Local TTS provider seam: Kokoro, Piper, or another local/offline TTS engine.
- Optional voice: if STT/TTS is unavailable, the app must still run in text mode.

## Related repositories

- Factory Core: `tpcmUAE/tpcm-ai-factory`
- Command Center: `tpcmUAE/aif-cc`
- Studio: `tpcmUAE/aif-studio`
- Marketplace: `tpcmUAE/aif-marketplace`
- Mobile App: `tpcmUAE/aif-app`
