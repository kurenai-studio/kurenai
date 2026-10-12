#!/usr/bin/env node
/**
 * Kurenai command line. Talks to the per-project cocos host
 * (bin/kurenai-cocos-host.mjs), starting it in the background when needed.
 *
 *   kurenai init <dir> [--3d | --template base-ai|base-ai-3d]
 *   kurenai host start|status|stop [--project <dir>] [--timeout <seconds>]
 *   kurenai import <file|dir>... [--project <dir>]
 *   kurenai asset info <file> [--project <dir>]
 *   kurenai logs [--since <seq>] [--errors [--all]] [--project <dir>]
 *   kurenai context [--project <dir>]
 *   kurenai check [--project <dir>]
 *   kurenai kit add <folder|zip|kura-pack-id> [--name <kit>] [--project <dir>]
 *   kurenai publish [--platform web-desktop|web-mobile|wechatgame|openpaas] [--out <dir>] [--release] [--verbose] [--project <dir>]
 *                   wechatgame: [--preview [--qrcode <file>] | --upload --version <x.y.z>] [--appid <wx...>] [--private-key <file>]
 *   kurenai wechat <check|subpackage|propose-subpackages|preview|upload|plugin> ...
 *   kurenai engine propose-cuts|apply-cuts [--project <dir>] [--from-build <wechatBuildDir>] [--minimal|module...]
 *   kurenai packs status|ensure [packId...] [--fetch]
 *
 * Host readiness wait defaults to 600s (override --timeout / KURENAI_HOST_READY_TIMEOUT_MS).
 * On wait expiry the detached host is left running so slow first imports can finish.
 */
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, resolveProjectDir, wantsHelp } from '../lib/cli/parse.js';

const HOST_ENTRY = join(dirname(fileURLToPath(import.meta.url)), 'kurenai-cocos-host.mjs');
const STOP_TIMEOUT_MS = 8_000;
const POLL_MS = 500;
const WATCHER_GRACE_MS = 3_000;

const USAGE = `usage:
  kurenai init <dir> [--3d | --template base-ai|base-ai-3d]
  kurenai host start|status|stop [--project <dir>] [--timeout <seconds>]
  kurenai import <file|dir>... [--project <dir>]
  kurenai asset info <file> [--project <dir>]
  kurenai logs [--since <seq>] [--errors [--all]] [--project <dir>]
  kurenai context [--project <dir>]
  kurenai check [--project <dir>]
  kurenai kit add <folder|zip|kura-pack-id> [--name <kit>] [--project <dir>]
  kurenai publish [--platform web-desktop|web-mobile|wechatgame|openpaas] [--out <dir>] [--release] [--verbose] [--project <dir>]
                  wechatgame: [--preview [--qrcode <file>] | --upload --version <x.y.z>] [--appid <wx...>] [--private-key <file>]
  kurenai wechat <check|propose-subpackages|subpackage|preview|upload|plugin> ...
  kurenai engine propose-cuts|apply-cuts [--project <dir>] [--from-build <wechatBuildDir>] [--minimal|module...]
  kurenai packs status|ensure [packId...] [--fetch]

init        --3d is short for --template base-ai-3d (lit 3D scene + shadow + ambient).
import      refresh asset-db for the path(s) and return uuid / importer / sub-assets.
asset info  read uuid / importer / sub-assets from an existing .meta (no import).
            While the host runs it waits up to 3s for the watcher to import a new file.
logs        preview chunk stacks map back to assets/*.ts; shader failures point at .effect lines.
            With --errors, read clean / previewPage (not only entries length).
publish     every platform needs the core build pack (packs ensure build --fetch);
            wechatgame / openpaas also need their channel pack (platform:wechat|platform:sudv2);
            openpaas also needs OPENPAAS_ACCESS_TOKEN.
            wechatgame installs @kurenai-studio/wechat-minigame into ~/.kurenai/addons on first use
            (override the spec with KURENAI_WECHAT_MINIGAME_PACKAGE), checks WeChat's 4 MB main
            package limit, and with --preview / --upload calls miniprogram-ci. Credentials default to
            WECHAT_MINIGAME_APPID and WECHAT_MINIGAME_PRIVATE_KEY_PATH.
wechat      the addon's own CLI (size check, propose/configure subpackages, preview/upload).
engine      minimal on-demand includeModules (scan assets scripts/scenes). propose-cuts shows
            keep/remove; apply-cuts --minimal writes the minimal set; apply-cuts <module...>
            removes specific modules. --from-build annotates cuts with WeChat size artifacts.

host start waits for readiness (default 600s). Override with --timeout <seconds>
or env KURENAI_HOST_READY_TIMEOUT_MS. On wait expiry the host is left running
(first import can be slow); use \`kurenai host status\` to poll.

3D / custom shaders: docs/rendering.md`;

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

function resolveProject(options, hint) {
  try {
    return resolveProjectDir(options, hint);
  } catch (error) {
    exitWith(error instanceof Error ? error.message : String(error));
  }
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

async function ensureHost(project, options = {}) {
  const { resolveHostReadyTimeoutMs } = await import('../lib/index.js');
  const readyTimeoutMs = resolveHostReadyTimeoutMs(options);

  const running = readHostFile(project);
  if (running && (await hostStatus(running))?.ready) return running;

  const { ensureCorePack, resolveCocosCliRoot } = await import('../lib/index.js');
  const cocosCliRoot = resolveCocosCliRoot();
  await ensureCorePack({ cocosCliRoot });

  const logFile = join(project, 'temp', 'kurenai-host.log');
  if (!running) {
    mkdirSync(dirname(logFile), { recursive: true });
    const out = openSync(logFile, 'w');
    const child = spawn(process.execPath, ['--max-old-space-size=8192', HOST_ENTRY], {
      cwd: project,
      env: {
        ...process.env,
        PROJECT: project,
        PORT: process.env.PORT || '7460',
        KURENAI_COCOS_CLI_ROOT: cocosCliRoot,
      },
      stdio: ['ignore', out, out],
      detached: true,
    });
    child.unref();
    closeSync(out);
  }

  const deadline = Date.now() + readyTimeoutMs;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const host = readHostFile(project);
    if (host && (await hostStatus(host))?.ready) return host;
    const tail = logTail(logFile, 5);
    if (!host && tail.some((line) => line.includes('[kurenai-host]') && /failed|not found|required/.test(line))) {
      exitWith(`host failed to start:\n${logTail(logFile).join('\n')}`);
    }
  }

  const still = readHostFile(project);
  if (still) {
    exitWith(
      `host still starting after ${Math.round(readyTimeoutMs / 1000)}s (pid ${still.pid}); left running — poll with \`kurenai host status\` or see ${logFile}. Raise wait via --timeout <seconds> or KURENAI_HOST_READY_TIMEOUT_MS.`,
    );
  }
  exitWith(`host not ready after ${Math.round(readyTimeoutMs / 1000)}s; see ${logFile}`);
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

function printUsage(exitCode) {
  process.stderr.write(`${USAGE}\n`);
  process.exit(exitCode);
}

/** `kurenai wechat ...` runs the WeChat addon's own CLI (kurenai-wechat), installing it first. */
async function runWechatCli(args) {
  const { ensureAddon, platformAddon } = await import('../lib/index.js');
  const { entry } = await ensureAddon(platformAddon('wechatgame'));
  let root = dirname(entry);
  while (!existsSync(join(root, 'package.json'))) root = dirname(root);
  const bin = Object.values(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).bin ?? {})[0];
  if (!bin) exitWith(`no CLI in ${root}`);
  const child = spawn(process.execPath, [join(root, bin), ...args], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 1));
}

async function runEngineCli(args) {
  const { positional, options } = parseArgs(args);
  const [command, ...modules] = positional;
  const project = resolveProject(options);
  const { proposeEngineCuts, applyEngineCuts, applyMinimalEngineModules } = await import('../lib/index.js');
  if (command === 'propose-cuts') {
    let artifacts;
    if (typeof options['from-build'] === 'string') {
      const { ensureAddon, platformAddon, loadAddon } = await import('../lib/index.js');
      const addon = platformAddon('wechatgame');
      await ensureAddon(addon);
      const mod = await loadAddon(addon);
      const report = mod.checkPackageSize(resolve(options['from-build']));
      artifacts = report.main?.largest ?? [];
    }
    const result = await proposeEngineCuts(project, artifacts ? { artifacts } : {});
    print({
      ok: true,
      ...result,
      summary: {
        before: result.included.length,
        after: result.minimal.length,
        removed: result.cuts.length,
      },
    });
    return;
  }
  if (command === 'apply-cuts') {
    if (options.minimal === true || modules[0] === '--minimal') {
      print({ ok: true, ...(await applyMinimalEngineModules(project)) });
      return;
    }
    if (!modules.length) {
      exitWith(
        'apply-cuts needs --minimal (write on-demand set) or module ids, e.g. kurenai engine apply-cuts physics-ammo',
      );
    }
    print({ ok: true, ...(await applyEngineCuts(project, modules)) });
    return;
  }
  exitWith(`unknown engine command: ${command ?? ''}\n\n${USAGE}`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === 'wechat') return runWechatCli(argv.slice(1));
  if (argv[0] === 'engine') return runEngineCli(argv.slice(1));
  if (wantsHelp(argv)) printUsage(0);

  const { positional, options } = parseArgs(argv);
  const [group, command, target] = positional;

  if (group === 'init' && command) {
    const template =
      options['3d'] === true
        ? 'base-ai-3d'
        : typeof options.template === 'string'
          ? options.template
          : 'base-ai';
    if (template !== 'base-ai' && template !== 'base-ai-3d') {
      exitWith('template must be base-ai or base-ai-3d (or pass --3d)');
    }
    const control = await projectControl();
    const project = await control.initialize(resolve(command), template);
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
    const query = new URLSearchParams({
      since: String(options.since ?? 0),
      ...(options.errors ? { errors: '1' } : {}),
      ...(options.all ? { all: '1' } : {}),
    });
    print(await (await fetch(`${host.serverUrl}/__kurenai/logs?${query}`)).json());
    return;
  }

  if (group === 'kit' && command === 'add' && target) {
    const project = resolveProject(options);
    const { addKit } = await import('../lib/index.js');
    print(await addKit(project, target, typeof options.name === 'string' ? options.name : undefined));
    return;
  }

  if (group === 'check') {
    const project = resolveProject(options);
    const result = await (await projectControl()).typecheck(project);
    print(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (group === 'publish') {
    const project = resolveProject(options);
    const control = await projectControl();
    const result = await control.publish(project, {
      platform: options.platform ?? 'web-desktop',
      ...(options.out ? { outDir: resolve(options.out) } : {}),
      ...(options.release ? { release: true } : {}),
      ...(options.verbose ? { verbose: true } : {}),
      wechat: {
        ...(options.preview ? { preview: true } : {}),
        ...(options.upload ? { upload: true } : {}),
        ...(typeof options.version === 'string' ? { version: options.version } : {}),
        ...(typeof options.appid === 'string' ? { appid: options.appid } : {}),
        ...(typeof options['private-key'] === 'string' ? { privateKeyPath: resolve(options['private-key']) } : {}),
        ...(typeof options.qrcode === 'string' ? { qrcodeOutput: resolve(options.qrcode) } : {}),
        ...(typeof options.desc === 'string' ? { desc: options.desc } : {}),
        ...(typeof options.robot === 'string' ? { robot: Number(options.robot) } : {}),
        ...(options['virtual-payment'] ? { virtualPayment: true } : {}),
      },
    });
    print({ ok: true, ...result });
    if (result.ok === false) process.exitCode = 1;
    return;
  }

  if (group === 'packs') {
    const { packsStatus, ensurePacks, listKnownPackIds } = await import('../lib/index.js');
    if (command === 'status') {
      print({ ok: true, ...packsStatus() });
      return;
    }
    if (command === 'ensure') {
      const ids = positional.slice(2);
      const required = ids.length ? ids : ['core'];
      const unknown = required.filter((id) => !listKnownPackIds().includes(id));
      if (unknown.length) exitWith(`unknown pack id(s): ${unknown.join(', ')}`);
      const result = await ensurePacks(required, { fetch: Boolean(options.fetch) });
      print({ ok: true, ...result });
      return;
    }
    printUsage(2);
  }

  if (group === 'host') {
    const project = resolveProject(options);
    if (command === 'start') {
      const host = await ensureHost(project, options);
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

  if (group === 'import' && command) {
    const paths = positional.slice(1).map((path) => resolve(path));
    const project = resolveProject(options, paths[0]);
    const { assetPathInProject, listImportTargets } = await import('../lib/index.js');
    for (const path of paths) {
      if (!assetPathInProject(project, path)) exitWith(`path must be inside ${join(project, 'assets')}: ${path}`);
      if (!existsSync(path)) exitWith(`no such file or directory: ${path}`);
    }
    const host = await ensureHost(project, options);
    const assets = [];
    for (const path of paths) {
      const isDir = statSync(path).isDirectory();
      if (isDir) await fetch(`${host.serverUrl}/__kurenai/refresh?path=${encodeURIComponent(path)}`, { method: 'POST' });
      for (const file of listImportTargets(path)) {
        const query = `path=${encodeURIComponent(file)}${isDir ? '&refresh=0' : ''}`;
        const body = await (await fetch(`${host.serverUrl}/__kurenai/asset?${query}`)).json();
        assets.push(
          body.ok
            ? { ok: true, ...body.asset }
            : { ok: false, path: relative(project, file), error: body.error, ...(body.asset ? { asset: body.asset } : {}) },
        );
      }
    }
    const failed = assets.filter((asset) => !asset.ok).length;
    print({
      ok: failed === 0,
      imported: assets.length - failed,
      failed,
      assets,
    });
    if (failed) process.exitCode = 1;
    return;
  }

  if (group === 'asset' && command === 'info' && target) {
    const file = resolve(target);
    const project = resolveProject(options, file);
    const { readAssetInfo } = await import('../lib/index.js');
    const metaPath = `${file}.meta`;
    const hostRunning = Boolean(readHostFile(project));
    if (hostRunning && existsSync(file) && !existsSync(metaPath)) {
      const deadline = Date.now() + WATCHER_GRACE_MS;
      while (!existsSync(metaPath) && Date.now() < deadline) await sleep(200);
    }
    try {
      print({ ok: true, asset: await readAssetInfo(project, file) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stillImporting = hostRunning && existsSync(file) && !existsSync(metaPath);
      exitWith(
        stillImporting
          ? `${message} (the host watcher may still be importing it; retry shortly or run \`kurenai import\` to wait for it)`
          : message,
      );
    }
    return;
  }

  printUsage(2);
}

main().catch((error) => exitWith(error instanceof Error ? error.message : String(error)));
