# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C deployment requirements include Docker Compose and nginx, but v1 is Mode A.

## Decision

Use GitHub Pages only. There is no `deploy/` directory, Dockerfile, compose stack, nginx config, Prometheus endpoint, or backend port.

## Consequences

Deployment is a static push to `main`. Rollback is a git revert. Custom domain setup is documented in `docs/deploy.md` if it is added later.

## Alternatives Considered

A small signaling/backend container was rejected because the app can use Yjs WebRTC signaling without owning infrastructure in v1.
