# Swarm protocol (workers + manager)

Repo: https://github.com/kurenai-studio/kurenai  
Base branch: `main`  
Install: clone from GitHub, `npm install` (optionally `npm link`). Do **not** publish to npm.

## Claim an issue

1. List open issues with label `swarm:available` and no assignee:
   `gh issue list --repo kurenai-studio/kurenai --label swarm:available --state open --json number,title,labels,assignees`
2. Pick one. Atomically claim:
   - `gh issue edit N --add-assignee @me --add-label swarm:claimed --remove-label swarm:available`
   - Immediately comment: `claiming: <your worker id>`
3. If assign fails or someone else already claimed, pick another issue. **Never** work an issue you do not own.

## Develop

1. Branch from latest `main`: `issue-<N>-short-slug`
2. Stay in scope of that single issue. Do not expand into other issues.
3. Follow `templates/shared/AGENTS.md` design: prefab/material files + View code; engine owns `.meta`; CLI for uuid/logs.
4. Self-test: `npm run check` (tsc + vitest + build). If the issue needs a host, use `node bin/kurenai.mjs …` against a temp project under `/tmp`.
5. Commit with a clear message; push branch; open PR to `main` with:
   - Title: `Fix #<N>: …`
   - Body starts with `Fixes #<N>`
   - Summary + Test plan checklist
6. After PR is open: `gh issue edit N --add-label swarm:in-review --remove-label swarm:claimed` and comment the PR URL.

## Manager review

Manager loops on open PRs targeting `main` that say `Fixes #<N>`:

1. Read issue acceptance criteria and PR diff.
2. Require `npm run check` style verification (CI if present, else check PR description / request changes).
3. **Accept**: approve, merge (squash or merge commit), ensure issue closes, remove swarm labels.
4. **Reject**: request changes with concrete bullets; move issue back to `swarm:claimed` (keep assignee) or `swarm:available` if abandoned.
5. Do not invent new scope. Do not close issues without a merged Fix.

## Out of scope for this swarm

- Prefab component matrix beyond MeshRenderer (deferred).
- Screenshot / selection / studio UI (human-in-the-loop later).
- Publishing to npm.
- Large M4 upstream cocos-cli work unless an issue explicitly asks for a small prep step.
