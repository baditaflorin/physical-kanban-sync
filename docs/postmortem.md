# Postmortem

## What Was Built

Physical Kanban Sync v0.1.0 is a static GitHub Pages app with an editable sticky-note Kanban, AprilTag camera scanner worker, deterministic wall-pan simulation, printable tag kit, IndexedDB persistence, JSON backup/import, Yjs WebRTC room sync, optional WebGPU/WebLLM assistant, local hooks, tests, smoke checks, ADRs, and visible version/commit metadata.

Live site: https://baditaflorin.github.io/physical-kanban-sync/

Repository: https://github.com/baditaflorin/physical-kanban-sync

## Was Mode A Correct?

Yes. Mode A was the right choice for v1. The core experience can run in the browser: camera input, WASM detection, local storage, peer sync, and local model inference. Mode B would not add value because there is no scheduled dataset. Mode C would mainly provide durable sync, auth, managed signaling, or integrations, which are explicit non-goals for v1.

## What Worked

- GitHub Pages was enabled from the first pushed commit.
- The initial JS payload stayed below the 200KB gzipped target because WebRTC sync and WebLLM are lazy-loaded.
- The local Pages-compatible preview server caught the repo base-path issue before publishing.
- Playwright smoke can verify the public UI without camera hardware by using simulated wall scans.

## What Did Not Work

- A generic static server did not simulate GitHub Pages project paths correctly, so `scripts/pages-preview.mjs` was added.
- Build metadata naturally lags by one commit unless a publish rebuild is made after source commits.
- Real camera AprilTag accuracy still needs physical-device testing across lighting, phone motion, print sizes, and wall layouts.

## Surprises

- The available browser AprilTag detector is best consumed as vendored WASM rather than a polished npm detector package.
- WebLLM is straightforward to lazy-load, but the model chunk and runtime are necessarily large after user activation.

## Accepted Tech Debt

- Public Yjs signaling is used instead of a project-owned signaling service.
- Camera calibration is a simple normalized x-position lane mapper.
- The local assistant summarizes board text, not camera imagery.
- There is no multi-board library or hosted account model.

## Next Three Improvements

1. Add calibration handles so teams can mark exact physical column boundaries.
2. Add OCR or local multimodal extraction to read sticky-note text from camera frames.
3. Add optional self-hosted signaling/durable sync as a Mode C follow-up ADR.

## Time Spent Vs Estimate

Estimate: one focused bootstrap pass for a production-shaped static prototype.

Actual: one focused implementation session. The extra time went into Pages path correctness, smoke testing, and keeping heavy WebRTC/WebLLM code lazy-loaded.
