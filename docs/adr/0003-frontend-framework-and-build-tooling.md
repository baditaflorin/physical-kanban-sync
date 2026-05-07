# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs a polished interactive board, strict TypeScript, tests, and GitHub Pages-friendly static output.

## Decision

Use React with TypeScript strict mode and Vite. Use Tailwind CSS for styling, lucide-react for icons, zod for data validation, TanStack Query for async cache boundaries, Vitest for unit tests, and Playwright for smoke/e2e checks.

## Consequences

Vite can build hashed assets into `docs/` and expose build-time version metadata. React keeps the UI ergonomic for drag, scanner panels, and peer state. Tailwind keeps styling local without a separate design system.

## Alternatives Considered

Vanilla TypeScript was rejected because the interaction surface is stateful. Next.js was rejected because a framework server is unnecessary and would complicate static Pages publishing.
