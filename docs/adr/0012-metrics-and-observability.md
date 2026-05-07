# 0012 - Metrics And Observability

## Status

Accepted

## Context

The app should not track users by default.

## Decision

Ship no analytics in v1. Surface local operational signals in the UI: scanner state, detected tag count, sync room state, IndexedDB save status, WebGPU availability, version, and commit.

## Consequences

There is no usage dashboard. The app remains privacy-preserving and static. Future analytics must be opt-in and documented in `docs/privacy.md`.

## Alternatives Considered

Plausible and a Cloudflare Worker beacon were rejected because usage insight is not required for v1 functionality.
