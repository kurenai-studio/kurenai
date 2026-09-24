#!/usr/bin/env node
/**
 * M2 puzzle demo: init a 2D project, write image + tile prefab + View logic, print uuids,
 * optionally start the preview host.
 *
 * Usage (from repo root):
 *   node scripts/run-puzzle.mjs [--dir <path>] [--cleanup] [--no-host]
 */
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KURENAI = join(REPO_ROOT, 'bin', 'kurenai.mjs');

const GRID = 3;
const TILE = 80;

const PUZZLE_TILE_PREFAB = `[
  { "__type__": "cc.Prefab", "_name": "PuzzleTile", "data": { "__id__": 1 } },
  { "__type__": "cc.Node", "_name": "PuzzleTile", "_components": [{ "__id__": 2 }, { "__id__": 3 }],
    "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 } },
  { "__type__": "cc.UITransform", "node": { "__id__": 1 },
    "_contentSize": { "__type__": "cc.Size", "width": 80, "height": 80 } },
  { "__type__": "cc.Sprite", "node": { "__id__": 1 }, "_sizeMode": 0 }
]`;

const PUZZLE_TILE_VIEW = `import {
    _decorator,
    Color,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    Texture2D,
    UITransform,
} from 'cc';
import type { IView } from '../kurenai/IView';

const { ccclass } = _decorator;

export type TileSelectHandler = (pieceId: number) => void;

/** One jigsaw slice; MainView wires selection through attach(). */
@ccclass('PuzzleTileView')
export class PuzzleTileView extends Component implements IView {
    private pieceId = -1;
    private onSelect: TileSelectHandler | null = null;
    private selected = false;

    bind(root: Node): void {
        const ui = root.getComponent(UITransform) ?? root.addComponent(UITransform);
        ui.setContentSize(${TILE}, ${TILE});
        root.getComponent(Sprite) ?? root.addComponent(Sprite);
    }

    attach(pieceId: number, texture: Texture2D, cols: number, rows: number, onSelect: TileSelectHandler): void {
        this.pieceId = pieceId;
        this.onSelect = onSelect;
        const col = pieceId % cols;
        const row = Math.floor(pieceId / cols);
        const texW = texture.width;
        const texH = texture.height;
        const pw = texW / cols;
        const ph = texH / rows;
        const frame = new SpriteFrame();
        frame.texture = texture;
        frame.rect.set(col * pw, (rows - 1 - row) * ph, pw, ph);
        const sprite = this.node.getComponent(Sprite)!;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        this.node.getComponent(UITransform)!.setContentSize(${TILE}, ${TILE});
        this.node.off(Node.EventType.TOUCH_END, this.onTap, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTap, this);
        this.setSelected(false);
    }

    setSelected(active: boolean): void {
        this.selected = active;
        this.node.setScale(active ? 1.06 : 1, active ? 1.06 : 1, 1);
    }

    private onTap = (): void => {
        if (this.pieceId >= 0) this.onSelect?.(this.pieceId);
    };
}
`;

const MAIN_VIEW = `import { _decorator, Color, Component, ImageAsset, Label, Node, Texture2D, resources } from 'cc';
import type { IView } from '../kurenai/IView';
import { addLabel, loadPrefab } from '../kurenai/helpers';
import { PuzzleTileView } from './PuzzleTileView';

const { ccclass } = _decorator;

const GRID = ${GRID};
const TILE = ${TILE};
const GAP = 6;

@ccclass('MainView')
export class MainView extends Component implements IView {
    private board: Node | null = null;
    private statusLabel: Label | null = null;
    /** slotIndex -> pieceId */
    private slots: number[] = [];
    /** pieceId -> tile node */
    private tiles = new Map<number, Node>();
    private selectedPiece: number | null = null;
    private won = false;

    bind(root: Node): void {
        this.board = new Node('Board');
        root.addChild(this.board);
        this.statusLabel = addLabel(root, 'Loading…', { name: 'Status', fontSize: 22, y: 220 });
        addLabel(root, 'Tap two tiles to swap', {
            name: 'Hint',
            fontSize: 18,
            y: 190,
            color: new Color(200, 200, 200, 255),
        });
        void this.build(root);
    }

    private async build(root: Node): Promise<void> {
        const image = await this.loadImage('images/puzzle');
        const texture = new Texture2D();
        texture.image = image;
        texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        this.slots = Array.from({ length: GRID * GRID }, (_, i) => i);
        this.shuffle(this.slots);
        for (let pieceId = 0; pieceId < GRID * GRID; pieceId += 1) {
            const tile = await loadPrefab('prefabs/PuzzleTile');
            this.board!.addChild(tile);
            const view = tile.addComponent(PuzzleTileView);
            view.bind(tile);
            view.attach(pieceId, texture, GRID, GRID, (id) => this.onPieceTap(id));
            this.tiles.set(pieceId, tile);
        }
        this.layoutTiles();
        this.setStatus('Swap tiles until the picture is restored');
    }

    private loadImage(path: string): Promise<ImageAsset> {
        return new Promise((resolve, reject) => {
            resources.load(path, ImageAsset, (err, asset) => (err ? reject(err) : resolve(asset)));
        });
    }

    private slotPosition(slot: number): { x: number; y: number } {
        const col = slot % GRID;
        const row = Math.floor(slot / GRID);
        const span = TILE + GAP;
        const ox = -((GRID - 1) * span) / 2;
        const oy = ((GRID - 1) * span) / 2;
        return { x: ox + col * span, y: oy - row * span };
    }

    private layoutTiles(): void {
        for (let slot = 0; slot < this.slots.length; slot += 1) {
            const pieceId = this.slots[slot];
            const node = this.tiles.get(pieceId);
            if (!node) continue;
            const { x, y } = this.slotPosition(slot);
            node.setPosition(x, y, 0);
        }
    }

    private shuffle(order: number[]): void {
        for (let i = order.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        if (order.every((v, idx) => v === idx) && order.length > 1) {
            [order[0], order[1]] = [order[1], order[0]];
        }
    }

    private onPieceTap(pieceId: number): void {
        if (this.won) return;
        const view = this.tiles.get(pieceId)?.getComponent(PuzzleTileView);
        if (!view) return;
        if (this.selectedPiece === null) {
            this.selectedPiece = pieceId;
            view.setSelected(true);
            this.setStatus('Pick another tile to swap');
            return;
        }
        if (this.selectedPiece === pieceId) {
            view.setSelected(false);
            this.selectedPiece = null;
            this.setStatus('Swap tiles until the picture is restored');
            return;
        }
        const other = this.selectedPiece;
        this.tiles.get(other)?.getComponent(PuzzleTileView)?.setSelected(false);
        const slotA = this.slots.indexOf(pieceId);
        const slotB = this.slots.indexOf(other);
        [this.slots[slotA], this.slots[slotB]] = [this.slots[slotB], this.slots[slotA]];
        this.selectedPiece = null;
        this.layoutTiles();
        if (this.slots.every((v, idx) => v === idx)) {
            this.won = true;
            this.setStatus('Complete!');
        } else {
            this.setStatus('Keep going…');
        }
    }

    private setStatus(text: string): void {
        if (this.statusLabel) this.statusLabel.string = text;
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

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function buildLandscapeRgba(size) {
  const data = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      let r = 0;
      let g = 0;
      let b = 0;
      const skyEnd = 0.52;
      if (ny < skyEnd) {
        const t = ny / skyEnd;
        r = 70 + t * 110;
        g = 130 + t * 70;
        b = 230 - t * 50;
        const sdx = nx - 0.78;
        const sdy = ny - 0.22;
        if (sdx * sdx + sdy * sdy < 0.018) {
          r = 255;
          g = 235;
          b = 90;
        }
      } else {
        const ridge = 0.52 + 0.1 * Math.sin(nx * Math.PI * 2.2);
        if (ny < ridge) {
          r = 55 + nx * 50;
          g = 70 + (1 - nx) * 35;
          b = 65;
        } else {
          const gnd = (ny - ridge) / (1 - ridge + 1e-5);
          r = 45 + gnd * 50;
          g = 110 - gnd * 35;
          b = 48 + gnd * 20;
        }
      }
      data[i] = r | 0;
      data[i + 1] = g | 0;
      data[i + 2] = b | 0;
      data[i + 3] = 255;
    }
  }
  return data;
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
  const imageDir = join(projectDir, 'assets', 'resources', 'images');
  const prefabDir = join(projectDir, 'assets', 'resources', 'prefabs');
  mkdirSync(imageDir, { recursive: true });
  mkdirSync(prefabDir, { recursive: true });
  const size = GRID * TILE;
  const rgba = buildLandscapeRgba(size);
  writeFileSync(join(imageDir, 'puzzle.png'), encodePng(size, size, rgba));
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

  const imagePath = join(projectDir, 'assets', 'resources', 'images', 'puzzle.png');
  const prefabPath = join(projectDir, 'assets', 'resources', 'prefabs', 'PuzzleTile.prefab');
  const imageInfo = runKurenai(['asset', 'info', imagePath, '--project', projectDir]);
  const prefabInfo = runKurenai(['asset', 'info', prefabPath, '--project', projectDir]);
  process.stdout.write(
    `${JSON.stringify({ ok: true, project: projectDir, image: imageInfo, prefab: prefabInfo }, null, 2)}\n`,
  );

  if (options.host) {
    const host = runKurenai(['host', 'start', '--project', projectDir]);
    process.stdout.write(`${JSON.stringify({ ok: true, previewUrl: host.previewUrl }, null, 2)}\n`);
    process.stderr.write(
      `Preview: swap tiles until the image is restored. Stop host: node ${KURENAI} host stop --project ${projectDir}\n`,
    );
  }

  if (options.cleanup) {
    if (options.host) runKurenai(['host', 'stop', '--project', projectDir]);
    rmSync(projectDir, { recursive: true, force: true });
    process.stdout.write(`${JSON.stringify({ ok: true, cleaned: projectDir })}\n`);
  }
}

main();
