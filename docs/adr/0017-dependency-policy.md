# 0017 - Dependency Policy

## Status

Accepted

## Context

The app depends on browser APIs, peer networking, WASM, and optional browser ML. Custom implementations would add risk.

## Decision

Use production-ready libraries for core responsibilities: React, Vite, Tailwind, zod, TanStack Query, idb, Yjs, y-webrtc, apriltag rendering, ARENA XR AprilTag WASM detection, lucide-react, WebLLM, Vitest, Playwright, ESLint, and Prettier.

## Consequences

The code focuses on product behavior and integration boundaries. Dependencies are pinned in `package-lock.json`, audited with `npm audit`, and documented when vendored.

## Alternatives Considered

Hand-rolling marker generation, peer sync, storage wrappers, or browser LLM runtime was rejected because established libraries already solve those concerns.
