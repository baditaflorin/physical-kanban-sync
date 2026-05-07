# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Users should keep their board between sessions without logging in or sending data to a server.

## Decision

Store the board document in IndexedDB through `idb`. Store only small UI preferences in `localStorage` when needed. Treat Yjs/WebRTC state as a sync transport, not as authoritative durable storage.

## Consequences

The app works offline after load and remains private to the browser by default. Users can export JSON backups manually. Cross-device persistence is not guaranteed unless peers are online at the same time.

## Alternatives Considered

OPFS was rejected as unnecessary for small JSON records. Server persistence was rejected because it requires Mode C and auth decisions that are out of scope for v1.
