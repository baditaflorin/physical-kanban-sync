# 0006 - WASM Modules

## Status

Accepted

## Context

AprilTag detection is compute-heavy and should use proven code. GitHub Pages cannot set custom COOP/COEP headers, so WASM choices must work without relying on SharedArrayBuffer.

## Decision

Vendor the BSD-3-Clause ARENA XR AprilTag standalone WASM detector for tag36h11 detection and load it inside a classic worker from `public/vendor/apriltag/`. Use `apriltag` from npm only to render printable tag images. Lazy-load WebLLM and its model assets only after a user opens the local assistant.

## Consequences

The scanner can run entirely client-side and avoid server image upload. WASM detection is loaded after the user starts scanning, keeping the first load small. WebLLM availability depends on WebGPU browser support and model download/caching.

## Alternatives Considered

Native Node AprilTag bindings were rejected because Pages has no Node runtime. A pure JS detector was considered but rejected for v1 performance risk. COOP/COEP-dependent threaded WASM was rejected because GitHub Pages cannot set the needed headers.
