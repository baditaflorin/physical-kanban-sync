# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL must work from the first commit and continue serving the built app.

## Decision

Publish from the `main` branch `/docs` folder at `https://baditaflorin.github.io/physical-kanban-sync/`. Configure Vite with `base: "/physical-kanban-sync/"`, hashed asset filenames, `docs/index.html`, `docs/404.html`, and `docs/.nojekyll`. Keep project documentation under subfolders inside `docs/` and do not gitignore `docs/`.

## Consequences

The built app is committed and served directly by Pages. Build output and documentation share `docs/`, so the build must preserve documentation files and only overwrite generated app assets. Version and commit metadata are generated at build time and shown in the UI.

## Alternatives Considered

A `gh-pages` branch was rejected to keep all deliverables on `main`. Publishing from repository root was rejected because source files and generated app files would collide.
