# Deploy

GitHub Pages serves this project from the `main` branch `/docs` folder:

https://baditaflorin.github.io/physical-kanban-sync/

To republish manually:

```sh
make build
git add docs
git commit -m "chore: publish pages build"
git push origin main
```

To roll back, revert the publishing commit and push `main` again.

No CNAME is configured in v1. If a custom domain is added later, create `docs/CNAME`, point DNS at GitHub Pages, and configure the domain in repository Pages settings.
