#!/usr/bin/env node
/**
 * Measure cocos host ready time and process RSS on macOS/Linux.
 *
 * Requires a local cocos-cli install (same as `kurenai host start`).
 * If cocos-cli is missing, prints a JSON error and exits 2 without writing logs.
 *
 * Usage (from repo root):
 *   node scripts/bench-host.mjs [--template base-ai|base-ai-3d] [--dir <path>]
 *   node scripts/bench-host.mjs --concurrent   # two temp projects (may be flaky)
 *   node scripts/bench-host.mjs --cleanup      # remove temp project dirs after stop
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KURENAI = join(REPO_ROOT, 'bin', 'kurenai.mjs');
const DEFAULT_PORT = 7460;
const CONCURRENT_PORTS = [7460, 7461];

function parseArgs(argv) {
  const options = {
    template: 'base-ai-3d',
    cleanup: false,
    concurrent: false,
    dir: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--cleanup') options.cleanup = true;
    else if (arg === '--concurrent') options.concurrent = true;
    else if (arg === '--template') options.template = argv[++i];
    else if (arg === '--dir') options.dir = resolve(argv[++i]);
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(
        `usage: node scripts/bench-host.mjs [--template base-ai|base-ai-3d] [--dir <path>] [--concurrent] [--cleanup]\\n`,
      );
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!['base-ai', 'base-ai-3d'].includes(options.template)) {
    throw new Error('--template must be base-ai or base-ai-3d');
  }
  return options;
}

function resolveCocosCliRoot() {
  return resolve(
    process.env.KURENAI_COCOS_CLI_ROOT ||
      join(homedir(), 'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33'),
  );
}

function cocosCliAvailable() {
  return existsSync(join(resolveCocosCliRoot(), 'dist/core/launcher.js'));
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function runKurenai(args, { cwd = REPO_ROOT, env = process.env } = {}) {
  const result = spawnSync(process.execPath, [KURENAI, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`kurenai ${args.join(' ')} failed (${result.status}): ${detail}`);
  }
  return JSON.parse(result.stdout);
}

function runKurenaiAsync(args, { cwd = REPO_ROOT, env = process.env } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [KURENAI, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`kurenai ${args.join(' ')} failed (${code}): ${(stderr || stdout).trim()}`));
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function processRssKb(pid) {
  const result = spawnSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8' });
  if (result.status !== 0) return undefined;
  const value = Number(result.stdout.trim());
  return Number.isFinite(value) ? value : undefined;
}

async function sampleRss(pid, { samples = 3, intervalMs = 250 } = {}) {
  const values = [];
  for (let i = 0; i < samples; i += 1) {
    const rss = processRssKb(pid);
    if (rss !== undefined) values.push(rss);
    if (i + 1 < samples) await sleep(intervalMs);
  }
  const rssKbMax = values.length ? Math.max(...values) : undefined;
  const rssKb = values.at(-1);
  return {
    rssKb,
    rssKbMax,
    rssMb: rssKbMax !== undefined ? Math.round((rssKbMax / 1024) * 10) / 10 : undefined,
    rssSamplesKb: values,
  };
}

function ensureProject(projectDir, template) {
  const hasProject = existsSync(join(projectDir, 'package.json')) && existsSync(join(projectDir, 'assets'));
  const initStarted = Date.now();
  if (!hasProject) runKurenai(['init', projectDir, '--template', template]);
  return { initMs: hasProject ? 0 : Date.now() - initStarted };
}

async function benchProject({ projectDir, template, port, cleanup }) {
  const { initMs } = ensureProject(projectDir, template);
  const hostStarted = Date.now();
  const host = runKurenai(['host', 'start', '--project', projectDir], {
    env: { PORT: String(port) },
  });
  const hostReadyMs = Date.now() - hostStarted;
  const rss = await sampleRss(host.pid);
  runKurenai(['host', 'stop', '--project', projectDir]);
  if (cleanup) rmSync(projectDir, { recursive: true, force: true });

  return {
    project: projectDir,
    template,
    port,
    pid: host.pid,
    previewUrl: host.previewUrl,
    initMs,
    hostReadyMs,
    totalMs: initMs + hostReadyMs,
    cocosCliRoot: resolveCocosCliRoot(),
    ...rss,
  };
}

async function benchConcurrent({ template, cleanup }) {
  const projects = CONCURRENT_PORTS.map((port, index) => ({
    port,
    dir: mkdtempSync(join(tmpdir(), `kurenai-bench-${index}-`)),
  }));

  try {
    for (const { dir } of projects) ensureProject(dir, template);

    const started = Date.now();
    const hosts = await Promise.all(
      projects.map(({ dir, port }) =>
        runKurenaiAsync(['host', 'start', '--project', dir], { env: { PORT: String(port) } }).then(
          (host) => ({ ...host, port, project: dir, hostReadyMs: Date.now() - started }),
        ),
      ),
    );

    const rssRows = await Promise.all(
      hosts.map(async (host) => ({
        project: host.project,
        port: host.port,
        pid: host.pid,
        previewUrl: host.previewUrl,
        hostReadyMs: host.hostReadyMs,
        ...(await sampleRss(host.pid)),
      })),
    );

    for (const { dir } of projects) runKurenai(['host', 'stop', '--project', dir]);
    if (cleanup) {
      for (const { dir } of projects) rmSync(dir, { recursive: true, force: true });
    }

    return {
      mode: 'concurrent',
      template,
      wallMs: Date.now() - started,
      hosts: rssRows,
      note: 'Two hosts on adjacent ports; timing and RSS can vary with machine load.',
    };
  } catch (error) {
    for (const { dir } of projects) {
      try {
        runKurenai(['host', 'stop', '--project', dir]);
      } catch {
        // best-effort cleanup
      }
      if (cleanup) rmSync(dir, { recursive: true, force: true });
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cliRoot = resolveCocosCliRoot();

  if (!cocosCliAvailable()) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: false,
          error: 'cocos-cli not found',
          cocosCliRoot: cliRoot,
          hint: 'Install cocos-cli (PinK default) or set KURENAI_COCOS_CLI_ROOT, then re-run this script.',
        },
        null,
        2,
      )}\n`,
    );
    process.exit(2);
  }

  if (process.platform !== 'darwin' && process.platform !== 'linux') {
    process.stdout.write(
      `${JSON.stringify({ ok: false, error: `unsupported platform: ${process.platform}` }, null, 2)}\n`,
    );
    process.exit(2);
  }

  const projectDir =
    options.dir ?? mkdtempSync(join(tmpdir(), `kurenai-bench-${options.template.replace('-', '')}-`));

  const summary = options.concurrent
    ? await benchConcurrent({ template: options.template, cleanup: options.cleanup })
    : await benchProject({
        projectDir,
        template: options.template,
        port: DEFAULT_PORT,
        cleanup: options.cleanup,
      });

  process.stdout.write(`${JSON.stringify({ ok: true, platform: process.platform, ...summary }, null, 2)}\n`);
}

main().catch((error) => {
  process.stdout.write(
    `${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`,
  );
  process.exit(1);
});
