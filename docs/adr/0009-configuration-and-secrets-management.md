# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

The app is public static frontend code. Secrets must never be committed or bundled.

## Decision

Use only non-secret build-time configuration in Vite env variables. Commit `.env.example` with placeholders. Do not require project-owned API keys. Hooks run gitleaks before commits when installed.

## Consequences

The frontend can be deployed publicly without secret risk. Users may provide future BYO keys only in local browser storage after an explicit feature ADR.

## Alternatives Considered

Encrypted frontend secrets were rejected because bundled secrets are still secrets. Runtime server-side secrets were rejected because Mode C is not used.
