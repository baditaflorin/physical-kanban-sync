# Physical Kanban Sync

Physical Kanban Sync turns tagged sticky notes on a wall into a browser-based digital Kanban that can be shared with remote teammates.

Live site: https://baditaflorin.github.io/physical-kanban-sync/

Repository: https://github.com/baditaflorin/physical-kanban-sync

Support: https://www.paypal.com/paypalme/florinbadita

## Quickstart

```sh
npm install
make install-hooks
make dev
make build
make smoke
```

## What It Does

- Scans AprilTag 36h11 markers from the browser camera and maps note positions into Kanban columns.
- Persists board state locally with IndexedDB and syncs peers through Yjs over WebRTC.
- Offers an optional WebGPU local LLM assistant for board summaries and next-step suggestions.

## Architecture

The v1 deployment is a static GitHub Pages application. Runtime compute happens in the browser using camera APIs, a vendored AprilTag WASM detector, IndexedDB, Yjs/WebRTC, and optional WebGPU.

See https://github.com/baditaflorin/physical-kanban-sync/tree/main/docs/adr for decision records.

## Local Checks

```sh
make fmt
make lint
make test
make build
make smoke
```
