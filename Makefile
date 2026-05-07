.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*##/ {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks

dev: ## Run the frontend dev server
	npm run dev

build: ## Build GitHub Pages output into docs/
	npm run build
	test -f docs/index.html

data: ## Mode A has no static data pipeline
	@echo "Mode A: no data artifacts to regenerate."

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests
	@echo "No integration tests are required for Mode A v1."

smoke: ## Build and run the Pages smoke test
	scripts/smoke.sh

lint: ## Run linters and TypeScript
	npm run lint
	npm run typecheck
	npm run fmt:check

fmt: ## Autoformat source files
	npm run fmt

pages-preview: ## Serve docs/ exactly as GitHub Pages would
	npm run pages-preview

release: ## Tag the current version
	git tag "v$$(node -p "require('./package.json').version")"
	git push origin "v$$(node -p "require('./package.json').version")"

clean: ## Remove local generated output
	rm -rf coverage playwright-report test-results

hooks-pre-commit: ## Run pre-commit hook manually
	.githooks/pre-commit

hooks-commit-msg: ## Run commit-msg hook manually with COMMIT_MSG_FILE=path
	.githooks/commit-msg "$${COMMIT_MSG_FILE:-.git/COMMIT_EDITMSG}"

hooks-pre-push: ## Run pre-push hook manually
	.githooks/pre-push
