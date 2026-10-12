#!/usr/bin/env node
/**
 * Copy the Cocos 4 wechatgame builder plugin from a full PinK / cocos-cli install into plugin/wechat.
 *
 * Ships only what the builder loads at runtime (package.json, dist/, static/, i18n/); no
 * node_modules, sources, or source maps. The plugin requires fs-extra, ejs, and jszip from
 * the cocos-cli core it is installed into.
 *
 *   node scripts/sync-plugin.mjs [--source <cocos-cli root>]
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const sourceArg = args.indexOf('--source');
const source = resolve(
  sourceArg >= 0
    ? args[sourceArg + 1]
    : join(homedir(), 'Library/Application Support/cocos-default/cocos-4.0.0-alpha.33'),
);
const out = join(repoRoot, 'plugin', 'wechat');
const RUNTIME_ENTRIES = ['package.json', 'dist', 'static', 'i18n'];
// separateEngine requires ../static/cocos/signature.json; PinK ships it under templates.
const PATCH_COPIES = [['static/templates/cocos/signature.json', 'static/cocos/signature.json']];

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${cmd} failed: ${result.stderr || result.stdout}`);
}

function main() {
  const sourceDir = join(source, 'packages', 'platforms', 'wechat');
  if (!existsSync(join(sourceDir, 'package.json'))) throw new Error(`no wechat plugin in ${source}`);
  const engineVersion = JSON.parse(readFileSync(join(source, 'packages', 'engine', 'package.json'), 'utf8')).version;

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const rel of RUNTIME_ENTRIES) {
    const src = join(sourceDir, rel);
    if (!existsSync(src)) continue;
    const isDir = statSync(src).isDirectory();
    run('rsync', [
      '-a', '--exclude', '*.map', '--exclude', 'node_modules', '--exclude', '.DS_Store',
      isDir ? `${src}/` : src,
      isDir ? `${join(out, rel)}/` : join(out, rel),
    ]);
  }

  const patches = [];
  for (const [from, to] of PATCH_COPIES) {
    if (existsSync(join(out, to)) || !existsSync(join(out, from))) continue;
    mkdirSync(dirname(join(out, to)), { recursive: true });
    copyFileSync(join(out, from), join(out, to));
    patches.push(`${from} -> ${to}`);
  }

  const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8'));
  const builder = pkg.contributes?.builder;
  if (!builder?.register) throw new Error('plugin package.json has no contributes.builder.register');
  for (const key of ['config', 'hooks']) {
    if (builder[key] && !existsSync(join(out, `${builder[key].replace(/^\.\//, '')}.js`))) {
      throw new Error(`builder.${key} (${builder[key]}) missing from plugin`);
    }
  }

  const marker = {
    id: 'platform:wechat',
    platform: builder.platform,
    pluginVersion: pkg.version,
    engineVersion,
    patches,
  };
  writeFileSync(join(out, '.kurenai-pack.json'), `${JSON.stringify(marker, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, out, ...marker }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
