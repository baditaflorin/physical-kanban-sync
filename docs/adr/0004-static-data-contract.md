# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no remote data pipeline, but the browser still needs a stable persisted board schema and import/export format.

## Decision

Use a versioned JSON board schema stored in IndexedDB and exportable by the user. The schema version is `physical-kanban-board-v1`, with columns, cards, scanner calibration, and timestamps validated by zod before use.

## Consequences

The app can migrate local data later without a backend. Corrupt local records fall back to the bundled demo board and show a clear error. No static data artifacts are required.

## Alternatives Considered

SQLite-WASM and DuckDB-WASM were rejected because v1 data is small, user-owned, and mutable in-browser. A runtime API contract was rejected because Mode C is not used.
