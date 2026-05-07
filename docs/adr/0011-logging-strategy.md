# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Production browser logs should be quiet and useful.

## Decision

Log only actionable scanner, sync, and assistant failures in production. Development builds may log diagnostic details. UI toasts and inline status messages are the primary user-facing feedback.

## Consequences

No PII or board content is sent anywhere for logging. Debugging production issues may require the user to reproduce locally and share browser console details.

## Alternatives Considered

Remote client logging was rejected because privacy and no-analytics are better defaults for v1.
