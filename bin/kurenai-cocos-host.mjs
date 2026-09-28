#!/usr/bin/env node
/**
 * Per-project cocos-cli host for Kurenai.
 *
 * Runs one cocos-cli project in this process: runtime + asset-db + packer +
 * browser game preview. cocos-cli has no filesystem watcher, so files written
 * straight to assets/ are pushed into asset-db here; cocos-cli's own
 * live-reload then broadcasts browser:reload after import/compile.
 *
 * env:
 *   PROJECT                  Cocos project root (required)
 *   PORT                     preview port (default 7460; cocos-cli may pick the next free one)
 *   LAUNCH_SCENE             db:// url or uuid (default: startScene in settings/v2/packages/project.json)
 *   KURENAI_COCOS_CLI_ROOT   override cocos core root (default: vendor/cocos-core inside the kurenai package)
 *   WATCH=0                  disable the assets/ watcher
 *   WATCH_POLL=1             poll assets/ instead of fs.watch (Docker bind mounts)
 *   WATCH_POLL_MS            poll interval (default 1000)
 *
 * HTTP (same origin as the preview):
 *   GET  /__kurenai/status   host + preview readiness
 *   GET  /__hmr/status       200 when ready, 503 otherwise (PreviewController contract)
 *   POST /__kurenai/refresh?path=<abs or relative to project>
 *   GET  /__kurenai/logs?since=<seq>&errors=1[&all=1]
 *        recent host output, including compile errors and forwarded browser logs;
 *        stack lines fold into their entry. errors=1 skips errors logged before the
 *        last successful preview boot (reported as `superseded`) unless all=1.
 *   GET  /__kurenai/asset?path=<abs or relative to project>
 *        refreshes the file, then returns asset-db's uuid / type / sub-assets
 *
 * While ready, the host advertises itself in <project>/temp/kurenai-host.json
 * so the `kurenai` CLI can find it.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, watch, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const DEBOUNCE_MS = 250;
const META_QUIET_MS = 1500;
const MAX_TARGETS = 20;
const CLOSE_TIMEOUT_MS = 5000;

const project = resolve(requireEnv('PROJECT'));
const assetsDir = join(project, 'assets');
const hostFile = join(project, 'temp', 'kurenai-host.json');
const port = Number(process.env.PORT || 7460);
// cocos-cli preview ignores project.json startScene and otherwise falls back to
// the first scene in asset-db, which is an engine-internal one.
const launchScene = process.env.LAUNCH_SCENE || projectStartScene();
const watchEnabled = process.env.WATCH !== '0';
const watchPoll = process.env.WATCH_POLL === '1';
const pollIntervalMs = Number(process.env.WATCH_POLL_MS || 1000);
const { resolveCocosCliRoot } = await import('../lib/index.js');
const cliRoot = resolveCocosCliRoot();

if (!existsSync(join(project, 'package.json'))) fail(`not a Cocos project: ${project}`);
if (!existsSync(join(cliRoot, 'dist/core/launcher.js'))) fail(`cocos-cli not found: ${cliRoot}`);

const cliRequire = createRequire(join(cliRoot, 'package.json'));
const load = (modulePath) => cliRequire(join(cliRoot, 'dist', modulePath));

const state = {
  phase: 'starting',
  project,
  cliRoot,
  url: '',
  startedAt: new Date().toISOString(),
  readyAt: undefined,
  watch: watchEnabled,
  refreshes: 0,
  compiles: 0,
  lastRefresh: undefined,
  lastCompiledAt: undefined,
  lastError: undefined,
};

const LOG_CAPACITY = 500;
const DETAIL_LINES = 12;
const logBuffer = [];
let logSeq = 0;
// Seq of the last successful preview boot; errors logged before it were fixed by a later edit.
let bootSeq = 0;

// Stack frames and Babel code frames belong to the entry above them.
const CONTINUATION = /^\s+at\s|^\s*>?\s*\d+\s*\||^\s+\|/;
const WARN_LINE = /^\s*WARN\b|\[Browser WARN\]|DeprecationWarning|\[DEP\d+\]|^\(Use `node --trace/;
const ERROR_LINE = /^\s*ERROR\b|\[Browser ERROR\]|asset-error|refresh failed|\b\w*Error:|\bfail(ed|s)?\b/i;
const BOOT_LINE = /\[Browser LOG\] Cocos game preview started/;

function levelOf(line) {
  if (WARN_LINE.test(line)) return 'warn';
  return ERROR_LINE.test(line) ? 'error' : 'info';
}

/** Keeps the last LOG_CAPACITY entries (host, compiler and forwarded browser logs). */
function captureOutput(stream) {
  const write = stream.write.bind(stream);
  let partial = '';
  stream.write = (chunk, ...rest) => {
    const text = partial + (typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    const lines = text.split('\n');
    partial = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const last = logBuffer[logBuffer.length - 1];
      if (last && CONTINUATION.test(line)) {
        last.detail ??= [];
        if (last.detail.length < DETAIL_LINES) last.detail.push(line.trimEnd());
        else last.omitted = (last.omitted ?? 0) + 1;
        continue;
      }
      logSeq += 1;
      if (BOOT_LINE.test(line)) bootSeq = logSeq;
      logBuffer.push({ seq: logSeq, at: new Date().toISOString(), level: levelOf(line), line: line.trim() });
      if (logBuffer.length > LOG_CAPACITY) logBuffer.shift();
    }
    return write(chunk, ...rest);
  };
}

captureOutput(process.stdout);
captureOutput(process.stderr);

let refreshing = false;
let lastRefreshEnd = 0;
let refreshChain = Promise.resolve();

function log(...args) {
  console.log('[kurenai-host]', ...args);
}

/** Structured import failure for `kurenai logs --errors` (matches /error|fail/i). */
function logAssetError(assetPath, reason) {
  const pathLabel =
    typeof assetPath === 'string' && assetPath
      ? isAbsolute(assetPath)
        ? relative(project, assetPath)
        : assetPath
      : '?';
  log(`asset-error path=${pathLabel} reason=${reason}`);
}

function fail(message) {
  console.error('[kurenai-host]', message);
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) fail(`${name} env required`);
  return value;
}

function projectStartScene() {
  try {
    const settings = JSON.parse(
      readFileSync(join(project, 'settings/v2/packages/project.json'), 'utf8'),
    );
    const scene = settings?.general?.startScene;
    return typeof scene === 'string' ? scene : '';
  } catch {
    return '';
  }
}

function isInside(root, target) {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

async function previewReady() {
  if (state.phase !== 'ready') return false;
  try {
    return await load('core/preview/preview-settings').isPreviewSettingsReady(launchScene);
  } catch {
    return false;
  }
}

/** Nearest existing path inside assets/ (deleted files refresh their folder). */
function existingTarget(path) {
  let current = path;
  while (!existsSync(current) && isInside(assetsDir, dirname(current)) && current !== assetsDir) {
    current = dirname(current);
  }
  return existsSync(current) ? current : assetsDir;
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function collapseTargets(paths) {
  const targets = [...new Set(paths.map(existingTarget))];
  if (targets.length > MAX_TARGETS || targets.includes(assetsDir)) return [assetsDir];
  const dirs = targets.filter(isDirectory);
  return targets.filter((target) => !dirs.some((dir) => dir !== target && isInside(dir, target))).sort();
}

function resolveAssetPath(raw) {
  const target = isAbsolute(raw) ? raw : join(project, raw);
  return isInside(assetsDir, target) ? target : undefined;
}

function describeAsset(info) {
  const subAssets = [];
  const collect = (children) => {
    for (const child of Object.values(children ?? {})) {
      subAssets.push({ uuid: child.uuid, name: child.name, type: child.type });
      collect(child.subAssets);
    }
  };
  collect(info.subAssets);
  return {
    path: relative(project, info.file || '') || info.file,
    url: info.url,
    uuid: info.uuid,
    type: info.type,
    importer: info.importer,
    imported: info.imported,
    invalid: info.invalid,
    subAssets,
  };
}

function refresh(paths, reason) {
  const targets = collapseTargets(paths);
  refreshChain = refreshChain.then(async () => {
    const { assetManager } = load('core/assets');
    const started = Date.now();
    refreshing = true;
    try {
      for (const target of targets) {
        await assetManager.refreshAsset(target);
      }
      state.refreshes += 1;
      state.lastRefresh = {
        at: new Date().toISOString(),
        reason,
        targets: targets.map((target) => relative(project, target) || '.'),
        ms: Date.now() - started,
      };
      log(`refresh (${reason}) ${state.lastRefresh.targets.join(', ')} in ${state.lastRefresh.ms}ms`);
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
      log(`refresh failed: ${state.lastError}`);
    } finally {
      refreshing = false;
      lastRefreshEnd = Date.now();
    }
  });
  return refreshChain;
}

/** Collects changed paths (relative to assets/) and refreshes them after a quiet period. */
function createChangeQueue(reason) {
  const pending = new Set();
  let timer;
  return (rel) => {
    const base = rel.split(sep).pop() || rel;
    if (base.startsWith('.') || base.endsWith('~') || base.endsWith('.tmp')) return;
    let target = join(assetsDir, rel);
    if (rel.endsWith('.meta')) {
      // asset-db rewrites .meta while importing; only react to .meta edits made outside a refresh
      if (refreshing || Date.now() - lastRefreshEnd < META_QUIET_MS) return;
      target = target.slice(0, -'.meta'.length);
    }
    pending.add(target);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const batch = [...pending];
      pending.clear();
      void refresh(batch, reason);
    }, DEBOUNCE_MS);
  };
}

function startWatcher() {
  const enqueue = createChangeQueue('watch');
  const watcher = watch(assetsDir, { recursive: true }, (_event, filename) => {
    if (filename) enqueue(filename.toString());
  });
  watcher.on('error', (error) => log(`watch error: ${error.message}`));
  log(`watching ${assetsDir}`);
  return watcher;
}

function snapshotAssets(dir = assetsDir, into = new Map()) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return into;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      into.set(path, 'dir');
      snapshotAssets(path, into);
      continue;
    }
    try {
      const stat = statSync(path);
      into.set(path, `${stat.mtimeMs}:${stat.size}`);
    } catch {
      // removed between readdir and stat
    }
  }
  return into;
}

function startPoller() {
  const enqueue = createChangeQueue('poll');
  let previous = snapshotAssets();
  const timer = setInterval(() => {
    const current = snapshotAssets();
    for (const [path, signature] of current) {
      if (previous.get(path) !== signature) enqueue(relative(assetsDir, path));
    }
    for (const path of previous.keys()) {
      if (!current.has(path)) enqueue(relative(assetsDir, path));
    }
    previous = current;
  }, pollIntervalMs);
  log(`polling ${assetsDir} every ${pollIntervalMs}ms`);
  return { close: () => clearInterval(timer) };
}

/**
 * After a SIGKILL / crash, packer-driver may leave proper-lockfile `*.lock` under
 * temp/programming. A new host then fails with "Lock is not acquired/owned by you".
 * Clear them when starting — this process is the only owner for this project.
 */
function clearStaleProgrammingLocks() {
  const root = join(project, 'temp', 'programming');
  if (!existsSync(root)) return;
  let removed = 0;
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith('.lock')) continue;
      try {
        rmSync(path, { force: true });
        removed += 1;
      } catch {
        // best-effort
      }
    }
  };
  walk(root);
  if (removed) log(`cleared ${removed} stale lock file(s) under temp/programming`);
}

function registerRoutes() {
  const { middlewareService } = load('server/middleware');
  middlewareService.register('KurenaiHost', {
    get: [
      {
        url: '/__kurenai/status',
        async handler(_req, res) {
          res.json({ ...state, ready: await previewReady() });
        },
      },
      {
        url: '/__hmr/status',
        async handler(_req, res) {
          const ready = await previewReady();
          res.status(ready ? 200 : 503).json({ ready, phase: state.phase });
        },
      },
      {
        url: '/__kurenai/logs',
        async handler(req, res) {
          const since = Number(req.query.since || 0);
          const errorsOnly = req.query.errors === '1';
          const includeSuperseded = req.query.all === '1';
          let superseded = 0;
          const entries = logBuffer.filter((entry) => {
            if (entry.seq <= since) return false;
            if (!errorsOnly) return true;
            if (entry.level !== 'error') return false;
            // Asset import errors are not fixed by a script edit, so they never go stale.
            if (entry.seq < bootSeq && !entry.line.includes('asset-error') && !includeSuperseded) {
              superseded += 1;
              return false;
            }
            return true;
          });
          res.json({
            ok: true,
            lastSeq: logSeq,
            ...(bootSeq ? { lastBootSeq: bootSeq } : {}),
            ...(superseded ? { superseded } : {}),
            entries,
          });
        },
      },
      {
        url: '/__kurenai/asset',
        async handler(req, res) {
          const raw = typeof req.query.path === 'string' ? req.query.path : '';
          const target = raw && resolveAssetPath(raw);
          if (!target) {
            res.status(400).json({ ok: false, error: `path must be inside ${assetsDir}` });
            return;
          }
          if (!existsSync(target)) {
            res.status(404).json({ ok: false, error: `no such file: ${relative(project, target)}` });
            return;
          }
          await refresh([target], 'api');
          const { assetManager } = load('core/assets');
          const info = assetManager.queryAssetInfo(target);
          if (!info) {
            const reason = 'asset-db has no asset for this path';
            logAssetError(target, reason);
            res.status(404).json({ ok: false, error: reason, lastError: state.lastError });
            return;
          }
          const asset = describeAsset(info);
          if (!info.imported || info.invalid) {
            const reason = 'import failed';
            logAssetError(target, reason);
            res.json({ ok: false, error: reason, asset });
            return;
          }
          // A typed importer that rejects the content makes asset-db fall back to
          // the generic '*' importer without reporting an error.
          const ext = extname(target).toLowerCase();
          const typed = load('core/assets/manager/asset-handler').default.extname2registerInfo[ext] ?? [];
          if (info.importer === '*' && typed.length) {
            const reason = `content not accepted by the ${ext} importer; check the file format`;
            logAssetError(target, reason);
            res.json({ ok: false, error: reason, asset });
            return;
          }
          res.json({ ok: true, asset });
        },
      },
    ],
    post: [
      {
        url: '/__kurenai/refresh',
        async handler(req, res) {
          const raw = typeof req.query.path === 'string' && req.query.path ? req.query.path : assetsDir;
          const target = resolveAssetPath(raw);
          if (!target) {
            res.status(400).json({ ok: false, error: `path must be inside ${assetsDir}` });
            return;
          }
          await refresh([target], 'api');
          res.json({ ok: !state.lastError, lastRefresh: state.lastRefresh, lastError: state.lastError });
        },
      },
    ],
  });
}

async function main() {
  log(`project ${project}`);
  log(`cocos-cli ${cliRoot}`);
  clearStaleProgrammingLocks();
  registerRoutes();

  const { default: Launcher } = load('core/launcher');
  const launcher = new Launcher(project);
  const scripting = load('core/scripting').default;
  scripting.on('compiled', () => {
    state.compiles += 1;
    state.lastCompiledAt = new Date().toISOString();
  });

  let watcher;
  const shutdown = async (signal) => {
    log(`${signal}, closing`);
    watcher?.close();
    rmSync(hostFile, { force: true });
    setTimeout(() => {
      log('close timed out, forcing exit');
      process.exit(0);
    }, CLOSE_TIMEOUT_MS).unref();
    try {
      await launcher.close();
    } catch (error) {
      log(`close failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(0);
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));

  try {
    await launcher.startGamePreview({ port, open: false, ...(launchScene ? { scene: launchScene } : {}) });
  } catch (error) {
    state.phase = 'failed';
    state.lastError = error instanceof Error ? error.message : String(error);
    fail(`preview failed: ${state.lastError}`);
  }

  const serverUrl = load('server').getServerUrl();
  state.url = launchScene ? `${serverUrl}/?scene=${encodeURIComponent(launchScene)}` : `${serverUrl}/`;
  state.phase = 'ready';
  state.readyAt = new Date().toISOString();
  if (watchEnabled) watcher = watchPoll ? startPoller() : startWatcher();
  mkdirSync(dirname(hostFile), { recursive: true });
  writeFileSync(hostFile, JSON.stringify({ pid: process.pid, serverUrl, previewUrl: state.url }, null, 2));
  log(`ready ${state.url}`);
}

main().catch((error) => fail(error instanceof Error ? error.stack || error.message : String(error)));
