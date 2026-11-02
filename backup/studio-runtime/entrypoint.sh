#!/bin/sh
# game-agent container entrypoint.
#
# Container MUST NOT load .env.* files at runtime (specs/infra.md §9.a).
# All env vars arrive via the ECS task definition's `environment:` and
# `secrets:` blocks.

set -eu

exec node /app/dist/entry.js
