# 0001 - Deployment Mode

## Status

Accepted

## Context

The app must bridge a physical sticky-note wall and a digital Kanban while defaulting to GitHub Pages. V1 needs camera scanning, local persistence, peer visibility, and optional local model assistance.

## Decision

Use Mode A: Pure GitHub Pages. The runtime is a static browser app with no project-owned backend. AprilTag detection runs in a browser worker with WASM, board state persists in IndexedDB, Yjs models collaboration state, WebRTC handles peer transport, and the local LLM assistant is lazy-loaded with WebGPU.

## Consequences

The public surface is only GitHub Pages. There are no server secrets, databases, containers, or runtime APIs in v1. WebRTC uses public signaling by default and peer connectivity can vary by network. Durable cloud sync, hosted auth, managed signaling, Jira import/export, and central audit logs are deferred.

## Alternatives Considered

Mode B was rejected because there is no scheduled data artifact to generate. Mode C was rejected because a runtime backend would only support non-goals such as hosted accounts, durable team state, or managed integrations.
