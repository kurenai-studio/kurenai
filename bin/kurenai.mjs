#!/usr/bin/env node
/**
 * Kurenai command line. Talks to the per-project cocos host
 * (bin/kurenai-cocos-host.mjs), starting it in the background when needed.
 *
 *   kurenai init <dir> --template base-ai|base-ai-3d
 *   kurenai host start|status|stop [--project <dir>]
 *   kurenai asset info <file> [--project <dir>]
 *   kurenai logs [--since <seq>] [--errors] [--project <dir>]
 *   kurenai context [--project <dir>]
 *   kurenai publish [--platform web-desktop|web-mobile] [--out <dir>] [--project <dir>]
 *
 * The project defaults to the nearest directory above the file (or cwd) that
 * contains assets/ and package.json. Output is JSON on stdout.
 */
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST_ENTRY = join(dirname(fileURLToPath(import.meta.url)), 'kurenai-cocos-host.mjs');
const READY_TIMEOUT_MS = 180_000;
const STOP_TIMEOUT_MS = 8_000;
const POLL_MS = 500;

const USAGE = `usage:
  kurenai init <dir> --template base-ai|base-ai-3d
  kurenai host start|status|stop [--project <dir>]
  kurenai asset info <file> [--project <dir>]
  kurenai logs [--since <seq>] [--errors] [--project <dir>]
  kurenai context [--project <dir>]
  kurenai publish [--platform web-desktop|web-mobile] [--out <dir>] [--project <dir>]`;

const FLAGS = new Set(['errors']);

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) positional.push(arg);
    else if (FLAGS.has(arg.slice(2))) options[arg.slice(2)] = true;
    else options[arg.slice(2)] = argv[++i];
  }
  return { positional, options };
}

async function projectControl() {
  const { ProjectControl } = await import('../lib/index.js');
  return new ProjectControl({});
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function exitWith(message, code = 1) {
  print({ ok: false, error: message });
  process.exit(code);
}

function findProject(from) {
  let dir = resolve(from);
  if (existsSync(dir) && statSync(dir).isFile()) dir = dirname(dir);
  for (;;) {
    if (existsSync(join(dir, 'assets')) && existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function resolveProject(options, hint) {
  const project = options.project ? resolve(options.project) : findProject(hint ?? process.cwd());
  if (!project || !existsSync(join(project, 'assets'))) exitWith('no Cocos project found; pass --project <dir>');
  return project;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readHostFile(project) {
  try {
    const host = JSON.parse(readFileSync(join(project, 'temp', 'kurenai-host.json'), 'utf8'));
    return alive(host.pid) ? host : undefined;
  } catch {
    return undefined;
  }
}

async function hostStatus(host) {
  try {
    const response = await fetch(`${host.serverUrl}/__kurenai/status`);
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

function logTail(logFile, lines = 20) {
  try {
    return readFileSync(logFile, 'utf8').trimEnd().split('\n').slice(-lines);
  } catch {
    return [];
  }
}

async function ensureHost(project) {
  const running = readHostFile(project);
  if (running && (await hostStatus(running))?.ready) return running;

  const logFile = join(project, 'temp', 'kurenai-host.log');
  if (!running) {
    mkdirSync(dirname(logFile), { recursive: true });
    const out = openSync(logFile, 'w');
    const child = spawn(process.execPath, ['--max-old-space-size=8192', HOST_ENTRY], {
      cwd: project,
      env: { ...process.env, PROJECT: project, PORT: process.env.PORT || '7460' },
      stdio: ['ignore', out, out],
      detached: true,
    });
    child.unref();
    closeSync(out);
  }

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const host = readHostFile(project);
    if (host && (await hostStatus(host))?.ready) return host;
    const tail = logTail(logFile, 5);
    if (!host && tail.some((line) => line.includes('[kurenai-host]') && /failed|not found|required/.test(line))) {
      exitWith(`host failed to start:\n${logTail(logFile).join('\n')}`);
    }
  }
  exitWith(`host not ready after ${READY_TIMEOUT_MS / 1000}s; see ${logFile}`);
}

async function stopHost(project) {
  const host = readHostFile(project);
  if (!host) return { ok: true, running: false };
  process.kill(host.pid, 'SIGTERM');
  const deadline = Date.now() + STOP_TIMEOUT_MS;
  while (alive(host.pid) && Date.now() < deadline) await sleep(200);
  if (alive(host.pid)) process.kill(host.pid, 'SIGKILL');
  return { ok: true, running: false, stopped: host.pid };
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [group, command, target] = positional;

  if (group === 'init' && command) {
    if (!options.template) exitWith('--template base-ai|base-ai-3d is required');
    const control = await projectControl();
    const project = await control.initialize(resolve(command), options.template);
    print({ ok: true, project });
    return;
  }

  if (group === 'context') {
    const project = resolveProject(options);
    const host = readHostFile(project);
    const status = host && (await hostStatus(host));
    const preview = { phase: status?.ready ? 'ready' : host ? 'starting' : 'not-started', url: host?.previewUrl ?? '(none)' };
    process.stdout.write(`${(await projectControl()).contextText(project, preview)}\n`);
    return;
  }

  if (group === 'logs') {
    const project = resolveProject(options);
    const host = readHostFile(project);
    if (!host) exitWith('host is not running; start it with `kurenai host start`');
    const query = new URLSearchParams({ since: String(options.since ?? 0), ...(options.errors ? { errors: '1' } : {}) });
    print(await (await fetch(`${host.serverUrl}/__kurenai/logs?${query}`)).json());
    return;
  }

  if (group === 'publish') {
    const project = resolveProject(options);
    const control = await projectControl();
    const result = await control.publish(project, {
      platform: options.platform ?? 'web-desktop',
      ...(options.out ? { outDir: resolve(options.out) } : {}),
    });
    print({ ok: true, ...result });
    return;
  }

  if (group === 'host') {
    const project = resolveProject(options);
    if (command === 'start') {
      const host = await ensureHost(project);
      print({ ok: true, project, pid: host.pid, previewUrl: host.previewUrl });
      return;
    }
    if (command === 'status') {
      const host = readHostFile(project);
      const status = host && (await hostStatus(host));
      print({ ok: true, project, running: Boolean(host), ready: Boolean(status?.ready), previewUrl: host?.previewUrl, lastRefresh: status?.lastRefresh, lastError: status?.lastError });
      return;
    }
    if (command === 'stop') {
      print({ project, ...(await stopHost(project)) });
      return;
    }
  }

  if (group === 'asset' && command === 'info' && target) {
    const file = resolve(target);
    const project = resolveProject(options, file);
    const host = await ensureHost(project);
    const response = await fetch(`${host.serverUrl}/__kurenai/asset?path=${encodeURIComponent(file)}`);
    const body = await response.json();
    print(body);
    if (!body.ok) process.exitCode = 1;
    return;
  }

  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

main().catch((error) => exitWith(error instanceof Error ? error.message : String(error)));
