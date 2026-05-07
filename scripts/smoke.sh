#!/usr/bin/env sh
set -eu

npm run build
npx playwright test
