# Headless-cocos / stack path inventory

Machine survey: **2026-09-24** (WORKER-I). Paths are absolute on the developer machine that hosts `sub-private`; other machines may differ—use the search hints at the bottom to reconcile.

Related migration plan: [cocos-cli-migration.md §4](./cocos-cli-migration.md#4-迁移清单本机-stack-与-headless-cocos).

## Workspace layout (canonical)

| Path | Kind | Purpose | Suggested disposition |
|------|------|---------|----------------------|
| `/Users/shinjiyu/Documents/sub-private/rubik-workspace/engines/kurenai/` | directory | Local “engines/kurenai” bundle: symlinks + `stack/` | **Leave** until M4 archive; document-only in this issue |
| `/Users/shinjiyu/Documents/sub-private/puzzle-workspace/engines` | symlink → `../rubik-workspace/engines` | Puzzle bench sees the same `engines/` tree as rubik | **Leave** (alias only) |
| `/Users/shinjiyu/Documents/sub-private/rubik-workspace/engines/kurenai/plugin` | symlink → `sub-private/kurenai` | Dev checkout of the kurenai npm package | **Leave**; prefer GitHub clone / swarm worktrees for agents |
| `/Users/shinjiyu/Documents/sub-private/rubik-workspace/engines/kurenai/headless-cocos` | symlink → `rubik-bench/_deps/headless-cocos` | Historical headless runtime kit (read-only upstream) | **Leave** symlink; target → **move to `archive/`** in a later issue |

Only one physical `headless-cocos` tree exists on this machine (see search notes).

## headless-cocos (frozen upstream)

| Path | Purpose | Suggested disposition |
|------|---------|----------------------|
| `/Users/shinjiyu/Documents/sub-private/rubik-bench/_deps/headless-cocos` | Git clone of [shinjiyu/headless-cocos](https://github.com/shinjiyu/headless-cocos); marked read-only in `MIGRATED.md` (~3.8 MB) | **Move to `archive/headless-cocos`** (or tarball) after importer matrix (#13) and M4; do **not** delete in swarm issues |
| `…/headless-cocos/spike/preview-mirror.mjs` | Self-contained preview + `assets/` watcher for 3.8 engine snapshot workflow | **Archive** with tree; replaced by `bin/kurenai-cocos-host.mjs` |
| `…/headless-cocos/spike/importers/*.cjs` (13 modules: glTF, Spine, BMFont, plist, etc.) | Custom asset-db importers for headless mirror | **Archive**; coverage tracked in #13 vs cocos-cli asset-db |
| `…/headless-cocos/spike/packer/` (`build.cjs`, `plugin-cr.cjs`, …) | Mini packer for headless preview bundles | **Archive**; replaced by cocos-cli packer-driver |
| `…/headless-cocos/spike/fixtures/` | e2e fixtures for importer / HMR probes | **Archive** with repo; useful reference for #13 |
| `…/headless-cocos/spike/*e2e*.cjs`, `hmr-smoke.mjs`, `bench-*.cjs` | One-off validation scripts for headless spike | **Archive** or delete inside archived repo only |
| `…/headless-cocos/demo/`, `docker/`, `docs/`, `scripts/`, `notes/` | Research / demo / container docs | **Archive** with repo |
| `…/headless-cocos/spike/publish/*` | Planned in migration §4 | **Not present** on this checkout—likely never shipped in public snapshot or already removed |
| `…/headless-cocos/spike/engine-snapshot` | Engine snapshot for 3.8 mirror | **Not present** on this checkout—Creator 4 stack used shim instead (see `stack/spike/preview-mirror.mjs`) |

## stack (local kurenai adjunct)

Prefix: `/Users/shinjiyu/Documents/sub-private/rubik-workspace/engines/kurenai/stack/` (~72 KB).

| Path | Purpose | Suggested disposition |
|------|---------|----------------------|
| `stack/templates/base-ai/` | 2D empty project shell for old `ProjectControl.initialize` | **Already migrated** to `kurenai/templates/base-ai` — delete stack copy after bench scripts retarget repo templates |
| `stack/templates/base-ai-3d/` | 3D template with `main.scene` | **Already migrated** to `kurenai/templates/base-ai-3d` — same as above |
| `stack/spike/create-project.mjs` | Copy template into a new project dir | **Delete** when nothing calls it; `ProjectControl` copies from package `templates/` |
| `stack/spike/preview-mirror.mjs` | Creator 4 shim: `/__hmr/status` + PinK `cocos preview` | **Delete** after all benches use cocos host; logic lives in `bin/kurenai-cocos-host.mjs` |
| `stack/run-rubik.mjs` | E2E: initialize → write Rubik sources → preview (output: `rubik-bench/kurenai-native/`) | **Rewrite** to import `@kurenai-studio/kurenai` from repo root / CLI (#8 / M2 acceptance) |
| `stack/run-puzzle.mjs` | E2E: jigsaw demo (output: `puzzle-bench/kurenai-native/`) | **Rewrite** same as `run-rubik.mjs` |
| `stack/flesh-template.cjs` | One-shot Creator CLI to flesh `base-ai-3d` assets | **Leave** until templates stable, then **delete** or move to `scripts/` in kurenai repo |
| `stack/README.md` (parent) | Documents stack + symlinks | **Delete** with stack tree once archived |

## Bench output directories (not source)

| Path | Purpose | Suggested disposition |
|------|---------|----------------------|
| `/Users/shinjiyu/Documents/sub-private/rubik-bench/kurenai-native/` | Generated Cocos project from rubik run script | **Leave** / gitignore; safe to `rm -rf` for clean reruns |
| `/Users/shinjiyu/Documents/sub-private/puzzle-bench/kurenai-native/` | Generated project from puzzle run script | Same |
| `/Users/shinjiyu/Documents/sub-private/puzzle-bench/_src/JigsawPuzzle.ts` | Source fed by `run-puzzle.mjs` | **Move** into kurenai repo `scripts/` or sample when puzzle scaffold lands (#8/#9) |

## kurenai repo (successor)

| Path | Purpose | Suggested disposition |
|------|---------|----------------------|
| `templates/base-ai`, `templates/base-ai-3d`, `templates/shared` | Agent project scaffolds (successor to `stack/templates/*`) | **Keep** — canonical |
| `bin/kurenai-cocos-host.mjs`, `bin/kurenai.mjs` | Cocos host + CLI | **Keep** — canonical |
| `docs/安装方法.md` | Still mentions `KURENAI_HEADLESS_ROOT` / headless-cocos | **Update** in docs swarm issues (#2–#4); not part of this inventory PR |

## Disposition legend

- **Leave** — no change until a follow-up archive/delete issue.
- **Archive** — move tree under `archive/` or tagged tarball; no production dependency.
- **Delete** — remove after dependents rewritten (never bulk-delete large trees in a single docs issue).
- **Rewrite** — keep behavior, new path/API (CLI / package templates).

## How this survey was done

```bash
# Workspace parents mentioned in cocos-cli-migration.md §4
ls -la ~/Documents/sub-private/rubik-workspace/engines/kurenai/
ls -la ~/Documents/sub-private/puzzle-workspace/engines

# Unique headless-cocos directories (depth ≤ 5 under $HOME, excluding Library)
find ~ -maxdepth 5 -type d -name headless-cocos 2>/dev/null

# Stack / spike filenames from §4 table
find ~/Documents/sub-private/rubik-workspace/engines/kurenai/stack -maxdepth 3
find ~/Documents/sub-private/rubik-bench/_deps/headless-cocos/spike -maxdepth 2
```

No other `headless-cocos`, `create-project.mjs`, or `preview-mirror.mjs` paths were found under `/Users/shinjiyu/Documents` or `/tmp` at depth 6.
