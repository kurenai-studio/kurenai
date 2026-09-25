#!/usr/bin/env node
/**
 * Refresh vendor/cocos-core from a full PinK/cocos-cli install (source tree, not tgz).
 *
 *   node scripts/pack-cocos-core.mjs --source … --out vendor/cocos-core
 *   # or simply:
 *   npm run vendor:cocos
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const version = process.env.KURENAI_COCOS_CORE_VERSION || '4.0.0-alpha.33';
const source =
  process.argv[2] ||
  process.env.KURENAI_COCOS_CLI_ROOT ||
  join(homedir(), 'Library/Application Support/cocos-default', `cocos-${version}`);
const out = join(repoRoot, 'vendor', 'cocos-core');

if (!existsSync(join(source, 'dist/cli.js'))) {
  console.error(JSON.stringify({ ok: false, error: `source missing dist/cli.js: ${source}` }));
  process.exit(1);
}

const pack = spawnSync(
  process.execPath,
  [join(here, 'pack-cocos-core.mjs'), '--source', source, '--out', out],
  { cwd: repoRoot, stdio: 'inherit' },
);
if (pack.status !== 0) process.exit(pack.status ?? 1);

const install = spawnSync(process.execPath, [join(here, 'install-vendored-cocos.mjs')], {
  cwd: repoRoot,
  stdio: 'inherit',
});
process.exit(install.status ?? 1);
