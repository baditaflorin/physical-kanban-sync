# Architecture

## Context

```mermaid
flowchart LR
  user["Person: Facilitator<br/>Pans a phone or laptop camera across a physical sticky-note wall."]
  remote["Person: Remote teammate<br/>Joins a WebRTC room to see the digital board."]
  app["System: Physical Kanban Sync<br/>Static GitHub Pages app that scans AprilTags, persists board state, and syncs peers."]
  pages["External system: GitHub Pages<br/>Serves static HTML, JS, WASM, and assets."]
  signaling["External system: Public WebRTC signaling<br/>Helps peers discover each other for Yjs WebRTC."]
  model["External system: Model hosting<br/>Provides WebLLM model assets when the local assistant is started."]

  user -->|"Scans wall and edits cards<br/>Browser"| app
  remote -->|"Views and edits synced board<br/>Browser"| app
  pages -->|"Serves static app<br/>HTTPS"| app
  app -->|"Signals peer room<br/>WSS"| signaling
  app -->|"Downloads optional model assets<br/>HTTPS"| model
```

Live GitHub Pages boundary: https://baditaflorin.github.io/physical-kanban-sync/

Repository boundary: https://github.com/baditaflorin/physical-kanban-sync

## Container

```mermaid
flowchart LR
  user["Browser user"]
  pages["GitHub Pages<br/>Static hosting from main /docs"]
  peer["Peer browser<br/>Another teammate in the same room"]

  subgraph browser["Browser"]
    ui["Container: React app<br/>TypeScript, Vite<br/>Board UI, panels, backup, build metadata"]
    worker["Container: AprilTag worker<br/>Classic Web Worker + WASM<br/>Detects tag36h11 IDs from camera frames"]
    idb[("Container: IndexedDB<br/>Browser storage<br/>Stores the local board JSON")]
    sync["Container: Yjs document<br/>Yjs + y-webrtc<br/>Represents board state for peer sync"]
    llm["Container: Local assistant<br/>WebGPU + WebLLM<br/>Optional local summary and next actions"]
  end

  pages -->|"Serves static assets<br/>HTTPS"| ui
  user -->|"Interacts with<br/>DOM"| ui
  ui -->|"Sends grayscale frames<br/>postMessage"| worker
  worker -->|"Returns tag positions<br/>postMessage"| ui
  ui -->|"Persists board<br/>IndexedDB API"| idb
  ui -->|"Publishes board<br/>Yjs map"| sync
  sync -->|"Syncs updates<br/>WebRTC"| peer
  ui -->|"Starts on demand<br/>dynamic import"| llm
```

## Module Boundaries

- `src/features/board/` owns schema, seed data, reducer-style logic, storage, and board UI.
- `src/features/scanner/` owns camera frame capture, AprilTag worker calls, simulation, and printable tag rendering.
- `src/features/sync/` owns lazy-loaded Yjs/WebRTC room sessions.
- `src/features/assistant/` owns rule-based summaries and optional WebGPU/WebLLM execution.
- `src/features/meta/` owns public links and build metadata shown on GitHub Pages.
- `public/vendor/apriltag/` stores the vendored WASM detector and license.

## Deployment

Mode A: Pure GitHub Pages.

The Pages publish directory is `docs/`, served from the `main` branch. Vite uses base path `/physical-kanban-sync/`, hashed assets, a static worker, and a service worker scoped to the project path.
