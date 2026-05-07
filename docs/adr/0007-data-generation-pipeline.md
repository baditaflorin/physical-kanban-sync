# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B would require an offline data generation pipeline, but this v1 is Mode A.

## Decision

Do not implement a data generation pipeline in v1. `make data` is intentionally a no-op that documents Mode A.

## Consequences

There are no generated JSON, Parquet, or SQLite artifacts beyond the static app build. Future integrations that precompute issue exports can add a Mode B ADR and pipeline.

## Alternatives Considered

Generating demo boards at build time was rejected because the seed board can live in source and user data mutates in the browser.
