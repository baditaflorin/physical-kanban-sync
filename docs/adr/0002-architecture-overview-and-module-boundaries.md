# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The frontend must remain understandable as the prototype combines camera input, WASM, persistence, collaboration, and optional local AI.

## Decision

Use feature folders under `src/features/`: `board`, `scanner`, `sync`, `assistant`, and `meta`. Shared UI primitives and application shell live under `src/components` and `src/App.tsx`. Static worker and vendored WASM assets live in `public/` because they must be fetched directly by the browser.

## Consequences

Each feature owns its domain types and behavior. Cross-feature communication goes through React props, small service functions, and the board reducer. The app can lazy-load heavy scanner, sync, and assistant code only when requested.

## Alternatives Considered

A flat `src/` tree was rejected because camera, sync, and storage concerns would become tangled. A backend-first module split was rejected because v1 has no runtime backend.
