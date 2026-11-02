# Studio runtime snapshot

Read-only backup of the container the game agent runs in — every readable file
outside `node_modules/` — captured so the runtime pieces are versioned with the
rest of the toolchain.

```
prompts/system.md      agent system prompt
entrypoint.sh          container entrypoint (`exec node /app/dist/entry.js`)
package.json           runtime package manifest
runtime-manifest.json  runtime manifest (~240 KB)
bin/cli-rpc            CLI ↔ server RPC helper
scripts/               json-diff-filter.py
dist/                  six bundled server entry points (~20 MB, build output)
server-runtime.zip     packaged server runtime (~98 MB)
```

Deliberately excluded:

- `node_modules/` — 967 MB, reproducible from `package.json`.
- The per-session project workspace and the asset library; they live on mounted
  volumes outside the image, not in this container.

Nothing here is imported by the kurenai build. `dist/` and `server-runtime.zip`
are build output, not sources; a GitHub Release asset is a lighter home for the
98 MB archive than git history.
