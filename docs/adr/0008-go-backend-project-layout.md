# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap template includes Go backend guidance for Modes B and C.

## Decision

Do not scaffold Go backend directories in Mode A. There is no `cmd/`, `internal/`, `pkg/`, runtime server, Docker image, or Go module in v1.

## Consequences

The repository stays frontend-only and avoids empty backend structure. If Mode B or C is introduced later, the Go layout will be added with a new ADR before implementation.

## Alternatives Considered

Adding empty Go folders was rejected because it would imply a backend exists when the accepted deployment mode says otherwise.
