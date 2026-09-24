# Docker bind mounts and `WATCH_POLL`

On Linux, file changes on a **bind-mounted** host directory often do not produce
reliable `inotify` events inside a container. The kurenai cocos host watches
`assets/` with Node `fs.watch` by default, so edits made on the host (or from
another container) may never trigger an asset-db refresh.

Use **polling mode** instead: the host scans `assets/` on an interval and
compares each file’s `mtime` and size (same debounced refresh path as
`fs.watch`).

## Environment variables

| Variable | Default | Effect |
|----------|---------|--------|
| `WATCH` | enabled | Set `WATCH=0` to disable all asset watching. |
| `WATCH_POLL` | off | Set `WATCH_POLL=1` to poll instead of `fs.watch`. |
| `WATCH_POLL_MS` | `1000` | Poll interval in milliseconds. |

Implementation: `bin/kurenai-cocos-host.mjs`. When using the library,
`PreviewController` accepts `watchPoll: true`, which sets `WATCH_POLL=1` on the
spawned host process.

## CLI workflow

The `kurenai` CLI starts the host with `env: { ...process.env, PROJECT, PORT }`,
so export polling vars in the same shell before `host start` (or any command
that auto-starts the host):

```sh
export WATCH_POLL=1
export WATCH_POLL_MS=1000   # optional
kurenai host start
```

Or run the host entry directly:

```sh
WATCH_POLL=1 PROJECT=/path/to/cocos-project node /path/to/kurenai/bin/kurenai-cocos-host.mjs
```

## Expected log line

After the host starts, `<project>/temp/kurenai-host.log` should contain:

```text
[kurenai-host] polling /path/to/project/assets every 1000ms
```

(`7460` is the default preview port; the host may pick the next free port if
busy.)

## Manual smoke checklist (no bundled Docker image)

This repository **does not** ship a Docker image that includes cocos-cli (large,
platform-specific install). Docs-only smoke path until you maintain your own
image:

1. Prepare a custom image with Node 22+, a cocos-cli tree at
   `KURENAI_COCOS_CLI_ROOT`, and `kurenai` on `PATH` (clone + `npm link` is
   enough).
2. Bind-mount a Cocos project into the container (e.g. host `./my-game` →
   `/workspace`).
3. Inside the container, start the host with `PROJECT=/workspace` and
   `WATCH_POLL=1` (via `kurenai host start` or `kurenai-cocos-host.mjs`).
4. Confirm the **polling** log line above in `temp/kurenai-host.log`.
5. From the **host OS**, create or modify a file under the mounted `assets/`
   directory (not only from inside the container).
6. Verify asset-db refresh: compile lines in `kurenai logs --errors`, or
   `kurenai asset info` on the changed path after refresh.

Polling on **macOS without Docker** is covered in
[`docs/cocos-cli-migration.md`](cocos-cli-migration.md) (watcher section).

## Optional Compose sketch

Replace the image name with one that already contains cocos-cli and kurenai:

```yaml
services:
  kurenai-dev:
    image: your-kurenai-cocos-cli-image:latest
    working_dir: /workspace
    environment:
      WATCH_POLL: "1"
      WATCH_POLL_MS: "1000"
      PROJECT: /workspace
      KURENAI_COCOS_CLI_ROOT: /opt/cocos-cli
    volumes:
      - ./my-game:/workspace
    ports:
      - "7460:7460"
```

Start the host inside the service (`kurenai host start` or equivalent); the
compose file only sets env and mounts—it does not replace a cocos-cli install.
