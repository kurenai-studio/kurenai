#!/usr/bin/env node
/**
 * M2 scaffold: init a 2D project, write placeholder puzzle assets, print uuids,
 * optionally start the preview host.
 *
 * Usage (from repo root):
 *   node scripts/run-puzzle.mjs [--dir <path>] [--cleanup] [--no-host]
 */
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KURENAI = join(REPO_ROOT, 'bin', 'kurenai.mjs');

const PUZZLE_TILE_PREFAB = `[
  { "__type__": "cc.Prefab", "_name": "PuzzleTile", "data": { "__id__": 1 } },
  { "__type__": "cc.Node", "_name": "PuzzleTile", "_components": [{ "__id__": 2 }],
    "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 } },
  { "__type__": "cc.UITransform", "node": { "__id__": 1 },
    "_contentSize": { "__type__": "cc.Size", "width": 80, "height": 80 } }
]`;

const PUZZLE_TILE_VIEW = `import { _decorator, Color, Component, Graphics, Node } from 'cc';
import type { IView } from '../kurenai/IView';

const { ccclass } = _decorator;

/** Placeholder tile view; full jigsaw logic is a follow-up issue. */
@ccclass('PuzzleTileView')
export class PuzzleTileView extends Component implements IView {
    bind(root: Node): void {
        const graphics = root.getComponent(Graphics) ?? root.addComponent(Graphics);
        graphics.fillColor = new Color(90, 180, 120, 255);
        graphics.rect(-40, -40, 80, 80);
        graphics.fill();
    }
}
`;

const MAIN_VIEW = `import { _decorator, Component, Node } from 'cc';
import type { IView } from '../kurenai/IView';
import { addLabel, loadPrefab } from '../kurenai/helpers';
import { PuzzleTileView } from './PuzzleTileView';

const { ccclass } = _decorator;

@ccclass('MainView')
export class MainView extends Component implements IView {
    bind(root: Node): void {
        void this.build(root);
        addLabel(root, 'Puzzle scaffold', { name: 'Title', fontSize: 28, y: 200 });
    }

    private async build(root: Node): Promise<void> {
        const tile = await loadPrefab('prefabs/PuzzleTile');
        root.addChild(tile);
        tile.setPosition(0, -40, 0);
        tile.addComponent(PuzzleTileView).bind(tile);
    }
}
`;

function parseArgs(argv) {
  const options = { cleanup: false, host: true, dir: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--cleanup') options.cleanup = true;
    else if (arg === '--no-host') options.host = false;
    else if (arg === '--dir') options.dir = resolve(argv[++i]);
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`usage: node scripts/run-puzzle.mjs [--dir <path>] [--cleanup] [--no-host]\\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

function runKurenai(args, { cwd, json = true } = {}) {
  const result = spawnSync(process.execPath, [KURENAI, ...args], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`kurenai ${args.join(' ')} failed (${result.status}): ${detail}`);
  }
  return json ? JSON.parse(result.stdout) : result.stdout;
}

function writePuzzleAssets(projectDir) {
  const prefabDir = join(projectDir, 'assets', 'resources', 'prefabs');
  mkdirSync(prefabDir, { recursive: true });
  writeFileSync(join(prefabDir, 'PuzzleTile.prefab'), PUZZLE_TILE_PREFAB);
  writeFileSync(join(projectDir, 'assets', 'game', 'PuzzleTileView.ts'), PUZZLE_TILE_VIEW);
  writeFileSync(join(projectDir, 'assets', 'game', 'MainView.ts'), MAIN_VIEW);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectDir = options.dir ?? mkdtempSync(join(tmpdir(), 'kurenai-puzzle-'));
  const hasProject = existsSync(join(projectDir, 'package.json')) && existsSync(join(projectDir, 'assets'));
  if (!hasProject) {
    runKurenai(['init', projectDir, '--template', 'base-ai']);
  }
  writePuzzleAssets(projectDir);

  const prefabPath = join(projectDir, 'assets', 'resources', 'prefabs', 'PuzzleTile.prefab');
  const prefabInfo = runKurenai(['asset', 'info', prefabPath, '--project', projectDir]);
  process.stdout.write(`${JSON.stringify({ ok: true, project: projectDir, prefab: prefabInfo }, null, 2)}\n`);

  if (options.host) {
    const host = runKurenai(['host', 'start', '--project', projectDir]);
    process.stdout.write(`${JSON.stringify({ ok: true, previewUrl: host.previewUrl }, null, 2)}\n`);
    process.stderr.write(
      `Preview host is running for ${projectDir}. Stop with: node ${KURENAI} host stop --project ${projectDir}\n`,
    );
  }

  if (options.cleanup) {
    if (options.host) runKurenai(['host', 'stop', '--project', projectDir]);
    rmSync(projectDir, { recursive: true, force: true });
    process.stdout.write(`${JSON.stringify({ ok: true, cleaned: projectDir })}\n`);
  }
}

main();
