# 0013 - Testing Strategy

## Status

Accepted

## Context

The app needs fast local checks because GitHub Actions are explicitly out of scope.

## Decision

Use Vitest for board reducer, schema, storage, and scanner mapping tests. Use Playwright for a smoke test that builds, serves `docs/`, verifies the homepage, runs a simulated scan, and checks that version metadata is visible.

## Consequences

`make test`, `make build`, and `make smoke` provide local confidence before push. Camera hardware detection is exercised manually, while deterministic scan simulation is covered automatically.

## Alternatives Considered

Full browser-camera CI was rejected because no CI is used and camera devices are not stable test fixtures.
