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
 *        last successful preview boot (reported as `superseded`) unless all=1; an
 *        asset-error is superseded only by a later successful /__kurenai/asset check of
 *        the same path.
 *        previewPage is none | connected | booted: whether any browser page has
 *        reported since host start. With errors=1, clean is true only when a page
 *        booted and no current errors remain. Stack frames in preview chunks are
 *        mapped to assets/*.ts (entry.source = first mapped frame); a shader compile
 *        failure is one entry whose `shader` field points at the .effect lines;
 *        browser entries carry `page` (one number per connected preview page).
 *   GET  /__kurenai/asset?path=<abs or relative to project>[&refresh=0]
 *        refreshes the file (unless refresh=0), then returns asset-db's uuid / type / sub-assets
 *
 * While ready, the host advertises itself in <project>/temp/kurenai-host.json
 * so the `kurenai` CLI can find it.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, watch, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

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
/** Project-relative asset path -> logSeq of its last successful /__kurenai/asset check. */
const assetOkSeq = new Map();
const ASSET_ERROR_PATH = /asset-error path=(.*?) reason=/;
// Seq of the last successful preview boot; errors logged before it were fixed by a later edit.
let bootSeq = 0;
// Seq of the last line forwarded from any browser page; 0 means no page has run since start.
let browserSeq = 0;

// Preview page that is printing right now (set around each forwarded browser line).
let currentPage = 0;
let pageSeq = 0;
const openPages = new Set();

// Stack frames and Babel code frames belong to the entry above them.
const CONTINUATION = /^\s+at\s|^\s*>?\s*\d+\s*\||^\s+\|/;
const WARN_LINE = /^\s*WARN\b|\[Browser WARN\]|DeprecationWarning|\[DEP\d+\]|^\(Use `node --trace/;
const ERROR_LINE = /^\s*ERROR\b|\[Browser ERROR\]|asset-error|refresh failed|\b\w*Error:|\bfail(ed|s)?\b/i;
const BOOT_LINE = /\[Browser LOG\] Cocos game preview started/;
const BROWSER_LINE = /\[Browser [A-Z]+\]/;
const SHADER_FAIL = /\[Browser ERROR\] (\w+)Shader in '([^']+)' compilation failed/;
const SHADER_DUMP_HEADER = /Shader source dump:/;
const SHADER_DUMP_LINE = /^(\d+)(?: (.*))?$/;
const GLSL_ERROR = /ERROR: \d+:(\d+): (.*)$/;
const CHUNK_FRAME = /(https?:\/\/[^/\s]+\/chunks\/([0-9a-f]{2})\/([0-9a-f]+)\.js):(\d+):(\d+)/;

function levelOf(line) {
  if (WARN_LINE.test(line)) return 'warn';
  return ERROR_LINE.test(line) ? 'error' : 'info';
}

const chunkMaps = new Map();

/** Maps a preview chunk position back to the project source via packer-driver's source map. */
function mapChunkPosition(dir, hash, line, column) {
  const mapFile = join(project, 'temp/programming/packer-driver/targets/preview/chunks', dir, `${hash}.js.map`);
  let tracer = chunkMaps.get(mapFile);
  if (tracer === undefined) {
    tracer = null;
    try {
      const { TraceMap } = cliRequire('@jridgewell/trace-mapping');
      tracer = new TraceMap(readFileSync(mapFile, 'utf8'));
    } catch {
      // no map for this chunk
    }
    if (chunkMaps.size > 200) chunkMaps.clear();
    chunkMaps.set(mapFile, tracer);
  }
  if (!tracer) return undefined;
  const { originalPositionFor } = cliRequire('@jridgewell/trace-mapping');
  const pos = originalPositionFor(tracer, { line, column: Math.max(0, column - 1) });
  if (!pos.source || pos.line == null) return undefined;
  const file = pos.source.startsWith('file://') ? fileURLToPath(pos.source) : pos.source;
  return `${isAbsolute(file) ? relative(project, file) : file}:${pos.line}:${(pos.column ?? 0) + 1}`;
}

/** Rewrites a chunk URL in a stack frame to `assets/...ts:line:col`; returns the mapped location too. */
function mapFrame(line) {
  const match = CHUNK_FRAME.exec(line);
  if (!match) return { line };
  const location = mapChunkPosition(match[2], match[3], Number(match[4]), Number(match[5]));
  return location ? { line: line.replace(match[0], location), location } : { line };
}

/** Finds `source` inside the CCProgram block of an .effect file; returns its 1-based line. */
function effectLineOf(effectFile, program, source) {
  const wanted = source?.trim();
  if (!wanted || !effectFile) return undefined;
  let lines;
  try {
    lines = readFileSync(effectFile, 'utf8').split('\n');
  } catch {
    return undefined;
  }
  let inside = !program;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].trim();
    if (program && /^CCProgram\s/.test(text)) inside = text.split(/\s+/)[1] === program;
    else if (inside && text === wanted) return i + 1;
  }
  return undefined;
}

function effectFileOf(name) {
  const candidate = `${resolve(assetsDir, 'effects', name)}.effect`;
  if (existsSync(candidate)) return candidate;
  const base = `${name.split('/').pop()}.effect`;
  const search = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = search(path);
        if (found) return found;
      } else if (entry.name === base) return path;
    }
    return undefined;
  };
  try {
    return search(assetsDir);
  } catch {
    return undefined;
  }
}

/**
 * Folds a browser shader failure (header, numbered source dump, GLSL errors) into
 * its header entry, pointing each error at the .effect line it came from.
 */
function finishShaderBlock(block) {
  const [effectName, ...programs] = block.program.split('|');
  const stageKey = block.stage === 'Vertex' ? 'vs' : block.stage === 'Fragment' ? 'fs' : 'cs';
  const program = programs.map((p) => p.split(':')[0]).find((p) => p === stageKey || p.startsWith(stageKey));
  const effectFile = effectFileOf(effectName);
  const effectPath = effectFile ? relative(project, effectFile) : `${effectName}.effect`;
  // GLSL ES 3.00 sources start with a #version line that the dump leaves out.
  const dump = block.dump;
  const es3 = !dump[1]?.startsWith('#version') && dump.some((text) => /\blayout\s*\(|^\s*(in|out)\s/.test(text ?? ''));
  const offset = es3 ? 1 : 0;
  const errors = block.errors.map(({ glslLine, message }) => {
    const source = dump[glslLine - offset];
    const effectLine = effectLineOf(effectFile, program, source);
    return { ...(effectLine ? { effectLine } : {}), glslLine, message, ...(source ? { source: source.trim() } : {}) };
  });
  const first = errors[0];
  const where = first?.effectLine ? `${effectPath}:${first.effectLine}` : effectPath;
  const entry = block.entry;
  entry.line = `[Browser ERROR] shader compile failed: ${where} (${program ?? stageKey}) ${first?.message ?? ''}`.trim();
  entry.shader = { effect: effectPath, program: program ?? stageKey, errors };
  entry.detail = errors.map(
    (e) => `  ${e.effectLine ? `${effectPath}:${e.effectLine}` : `glsl line ${e.glslLine}`} | ${e.source ?? ''}  <- ${e.message}`,
  );
}

let shaderBlock;

/** Keeps the last LOG_CAPACITY entries (host, compiler and forwarded browser logs). */
function captureOutput(stream) {
  const write = stream.write.bind(stream);
  let partial = '';
  stream.write = (chunk, ...rest) => {
    const text = partial + (typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    const lines = text.split('\n');
    partial = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.replace(/\0/g, '');
      if (!line.trim()) {
        // The shader dump ends with the source's NUL terminator; plain blank lines are logger padding.
        if (shaderBlock && raw.includes('\0')) {
          finishShaderBlock(shaderBlock);
          shaderBlock = undefined;
        }
        continue;
      }
      if (shaderBlock) {
        const body = line.replace(/^.*\[Browser ERROR\]\s*/, '').trimStart();
        if (SHADER_DUMP_HEADER.test(line)) continue;
        const glsl = GLSL_ERROR.exec(body);
        if (glsl) {
          shaderBlock.errors.push({ glslLine: Number(glsl[1]), message: glsl[2] });
          continue;
        }
        const numbered = !shaderBlock.errors.length && SHADER_DUMP_LINE.exec(body);
        if (numbered) {
          shaderBlock.dump[Number(numbered[1])] = numbered[2] ?? '';
          continue;
        }
        finishShaderBlock(shaderBlock);
        shaderBlock = undefined;
      }
      const last = logBuffer[logBuffer.length - 1];
      if (last && CONTINUATION.test(line)) {
        const frame = mapFrame(line.trimEnd());
        if (frame.location && !last.source) last.source = frame.location;
        last.detail ??= [];
        if (last.detail.length < DETAIL_LINES) last.detail.push(frame.line);
        else last.omitted = (last.omitted ?? 0) + 1;
        continue;
      }
      logSeq += 1;
      if (BOOT_LINE.test(line)) bootSeq = logSeq;
      if (BROWSER_LINE.test(line)) browserSeq = logSeq;
      const entry = { seq: logSeq, at: new Date().toISOString(), level: levelOf(line), line: mapFrame(line.trim()).line };
      if (currentPage && BROWSER_LINE.test(line)) entry.page = currentPage;
      logBuffer.push(entry);
      if (logBuffer.length > LOG_CAPACITY) logBuffer.shift();
      const shader = SHADER_FAIL.exec(line);
      if (shader) shaderBlock = { entry, stage: shader[1], program: shader[2], dump: [], errors: [] };
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

// Replaces cocos-cli's injected console forwarder: queues messages until the socket
// opens (first-load logs), forwards Error stacks and resource load failures.
const CONSOLE_BRIDGE = `
<script>
(function () {
  var queue = [], open = false, ws;
  function fmt(a) {
    if (a instanceof Error) return a.stack || String(a);
    if (a && typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch (e) { return String(a); } }
    return String(a);
  }
  function send(level, args) {
    var msg = JSON.stringify({ type: 'log', level: level, message: Array.prototype.map.call(args, fmt).join(' ') });
    if (open) ws.send(msg); else if (queue.length < 500) queue.push(msg);
  }
  ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/console-log');
  ws.onopen = function () { open = true; queue.splice(0).forEach(function (m) { ws.send(m); }); };
  ws.onclose = function () { open = false; };
  ['log', 'error', 'warn', 'info', 'debug'].forEach(function (level) {
    var original = console[level];
    console[level] = function () { original.apply(console, arguments); send(level, arguments); };
  });
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) send('error', ['Failed to load resource: ' + (t.src || t.href)]);
    else if (e.error && e.error.stack) send('error', ['Uncaught ' + e.error.stack]);
    else send('error', ['Uncaught ' + e.message + ' (' + e.filename + ':' + e.lineno + ':' + e.colno + ')']);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    send('error', ['Unhandled Promise Rejection: ' + (r && r.stack ? r.stack : String(r))]);
  });
})();
</script>
`;
const STOCK_BRIDGE = /<script>\s*\(function\(\) \{\s*\/\/ 建立 WebSocket 连接[\s\S]*?<\/script>\s*/g;

function installConsoleBridge() {
  const service = load('server/console-log').consoleLogService;
  const { WebSocketServer } = cliRequire('ws');
  const inject = service.injectMiddleware;
  service.injectMiddleware = (req, res, next) => {
    const send = res.send;
    res.send = function (body) {
      if (typeof body === 'string' && STOCK_BRIDGE.test(body)) {
        let first = true;
        body = body.replace(STOCK_BRIDGE, () => (first ? ((first = false), CONSOLE_BRIDGE) : ''));
      }
      STOCK_BRIDGE.lastIndex = 0;
      return send.call(this, body);
    };
    inject(req, res, next);
  };
  service.startup = function (server) {
    this.wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
      if (new URL(request.url || '', 'http://base').pathname !== '/console-log') return;
      this.wss.handleUpgrade(request, socket, head, (ws) => this.wss.emit('connection', ws, request));
    });
    this.wss.on('connection', (ws) => {
      const page = ++pageSeq;
      openPages.add(page);
      ws.on('close', () => openPages.delete(page));
      ws.on('message', (message) => {
        let data;
        try {
          data = JSON.parse(message.toString());
        } catch {
          return;
        }
        if (data?.type !== 'log') return;
        const level = ['error', 'warn', 'info', 'debug'].includes(data.level) ? data.level : 'log';
        currentPage = page;
        try {
          console[level](`[Browser ${level.toUpperCase()}] ${data.message ?? ''}`);
        } finally {
          currentPage = 0;
        }
      });
    });
  };
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
          if (shaderBlock) {
            finishShaderBlock(shaderBlock);
            shaderBlock = undefined;
          }
          const since = Number(req.query.since || 0);
          const errorsOnly = req.query.errors === '1';
          const includeSuperseded = req.query.all === '1';
          let superseded = 0;
          const entries = logBuffer.filter((entry) => {
            if (entry.seq <= since) return false;
            if (!errorsOnly) return true;
            if (entry.level !== 'error') return false;
            if (includeSuperseded) return true;
            // Asset import errors are not fixed by a script edit or a reload, only by
            // a later successful import of the same path.
            const assetPath = ASSET_ERROR_PATH.exec(entry.line)?.[1];
            const stale = assetPath !== undefined
              ? (assetOkSeq.get(assetPath) ?? 0) > entry.seq
              : entry.seq < bootSeq;
            if (stale) {
              superseded += 1;
              return false;
            }
            return true;
          });
          const previewPage = bootSeq ? 'booted' : browserSeq ? 'connected' : 'none';
          res.json({
            ok: true,
            lastSeq: logSeq,
            previewPage,
            // true only when a page booted and no current error remains; false also means "cannot tell yet".
            ...(errorsOnly ? { clean: previewPage === 'booted' && entries.length === 0 } : {}),
            ...(previewPage === 'none'
              ? { hint: `No preview page has run since host start; open or reload ${state.url} before trusting an empty result.` }
              : {}),
            ...(bootSeq ? { lastBootSeq: bootSeq } : {}),
            ...(superseded ? { superseded } : {}),
            openPages: openPages.size,
            ...(openPages.size > 1
              ? { pagesHint: `${openPages.size} preview pages are open and all log here; each browser entry carries its page number. Close extra tabs if the output is confusing.` }
              : {}),
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
          if (req.query.refresh !== '0') await refresh([target], 'api');
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
          assetOkSeq.set(relative(project, target), logSeq);
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
  installConsoleBridge();
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
