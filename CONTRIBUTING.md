# Contributing

Thanks for helping improve Physical Kanban Sync.

## Development

```sh
npm install
make install-hooks
make dev
```

Use Conventional Commits for commit messages, for example `feat: add wall scanner`.

## Checks

Run these before pushing:

```sh
make fmt
make lint
make test
make build
make smoke
```

Do not commit secrets, API keys, `.env` files, private keys, generated logs, or machine-specific configuration.
