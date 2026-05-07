# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Camera permissions, WASM loading, peer sync, storage, and local model loading can fail independently.

## Decision

Return typed result objects from feature services where practical, validate persisted data with zod, and show recoverable errors in inline panels or global toasts. Unrecoverable React render failures are caught by an error boundary with a reset action.

## Consequences

The UI can degrade gracefully: manual/demo mode still works if camera or WASM fails, local persistence can reset to a seed board, peer sync can be disabled, and the assistant can remain unavailable without blocking the board.

## Alternatives Considered

Throwing errors through UI handlers was rejected because it makes permission and device failures harder to recover from.
