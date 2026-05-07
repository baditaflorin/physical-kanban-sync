# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project must use local hooks instead of GitHub Actions.

## Decision

Use a plain `.githooks/` directory configured by `make install-hooks`. Hooks run formatting, linting, TypeScript, tests, build, smoke, gitleaks, and Conventional Commits validation as appropriate.

## Consequences

Checks stay local and explicit. Contributors must install required local tools, including gitleaks, before hooks can fully pass.

## Alternatives Considered

Lefthook was considered but rejected to keep the repository dependency-light and transparent.
