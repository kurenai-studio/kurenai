#!/usr/bin/env node
/**
 * Static dist server with the two preview-mirror routes that plain `serve`
 * cannot provide:
 *   GET /src/effect.bin
 *   GET /engine_external/?url=external:…
 *
 * Usage:
 *   node spike/serve-dist.mjs --root=path/to/dist/web --port=7480
 *   --effect=path/to/effect.bin   (optional; defaults to <project>/temp/asset-db/effect/effect.bin)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseArgs(argv) {
  const out = { port: 7480 };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    if (!m) continue;
    out[m[1]] = m[3] === undefined ? true : m[3];
  }
  return out;
}

const args = parseArgs(process.argv);
const ROOT = path.resolve(
  args.root || path.join(process.env.PROJECT || '', 'dist/web'),
);
const PORT = Number(args.port || process.env.PORT || 7480);
const EFFECT =
  args.effect ||
  process.env.EFFECT_BIN ||
  path.join(path.dirname(ROOT), '..', 'temp', 'asset-db', 'effect', 'effect.bin');
// When ROOT is project/dist/web, project root is ../..
const PROJECT_ROOT = path.resolve(ROOT, '../..');
const EFFECT_FILE = path.resolve(
  args.effect ||
    process.env.EFFECT_BIN ||
    path.join(PROJECT_ROOT, 'temp/asset-db/effect/effect.bin'),
);
const NATIVE_EXT = path.join(ROOT, 'native-external');
const PROJECT_LIBRARY = path.join(PROJECT_ROOT, 'library');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function safeJoin(root, rel) {
  const full = path.normalize(path.join(root, rel));
  if (!full.startsWith(path.normalize(root))) return null;
  return full;
}

function mapSpecial(reqUrl) {
  const u = new URL(reqUrl, 'http://127.0.0.1');
  if (u.pathname === '/src/effect.bin') {
    return fs.existsSync(EFFECT_FILE) ? EFFECT_FILE : null;
  }
  if (u.pathname === '/engine_external/' || u.pathname === '/engine_external') {
    const raw = u.searchParams.get('url') || '';
    const rel = raw.replace(/^external:/, '');
    if (!rel) return null;
    return safeJoin(NATIVE_EXT, rel);
  }
  return null;
}

function queryExtname(uuid) {
  // Same semantics as preview-mirror: only `.cconb` for lone `.bin` library entries.
  const dir = safeJoin(PROJECT_LIBRARY, uuid.slice(0, 2));
  if (!dir || !fs.existsSync(dir)) return '';
  const exts = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${uuid}.`))
    .map((f) => f.slice(uuid.length).toLowerCase());
  if (!exts.length) return '';
  if (exts.length === 1 && exts[0] === '.bin') return '.cconb';
  return '';
}

const server = http.createServer((req, res) => {
  try {
    const reqUrl = req.url || '/';
    const u = new URL(reqUrl, 'http://127.0.0.1');

    const qe = u.pathname.match(
      /^\/query-extname\/([0-9a-fA-F-]{36}(?:@[0-9a-fA-F]+)*)\/?$/,
    );
    if (qe) {
      send(res, 200, queryExtname(qe[1]), 'text/plain; charset=utf-8');
      return;
    }

    const special = mapSpecial(reqUrl);
    if (special) {
      if (!fs.existsSync(special)) {
        send(res, 404, 'not found: ' + req.url);
        return;
      }
      const buf = fs.readFileSync(special);
      const ext = path.extname(special).toLowerCase();
      send(res, 200, buf, MIME[ext] || 'application/octet-stream');
      return;
    }

    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (pathname === '/') pathname = '/index.html';

    // Mirror preview-mirror libResolve for /assets/*/import|native/...
    const assetMatch = pathname.match(
      /^\/assets\/(?:general|internal|main|[^/]+)\/(import|native)\/([0-9a-fA-F]{2})\/(.+)$/,
    );
    if (assetMatch) {
      const shard = assetMatch[2];
      const base = assetMatch[3];
      const candidates = [
        safeJoin(ROOT, pathname.replace(/^\//, '')),
        safeJoin(PROJECT_LIBRARY, path.join(shard, base)),
      ].filter(Boolean);
      for (const file of candidates) {
        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
          const buf = fs.readFileSync(file);
          const ext = path.extname(file).toLowerCase();
          send(res, 200, buf, MIME[ext] || 'application/octet-stream');
          return;
        }
      }
      send(res, 404, 'not found: ' + pathname);
      return;
    }

    const file = safeJoin(ROOT, pathname.replace(/^\//, ''));
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      send(res, 404, 'not found: ' + pathname);
      return;
    }
    const buf = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    // extensionless import-map-global
    const type =
      MIME[ext] ||
      (file.endsWith('import-map-global')
        ? 'application/json; charset=utf-8'
        : 'application/octet-stream');
    send(res, 200, buf, type);
  } catch (e) {
    send(res, 500, String(e && e.message ? e.message : e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[serve-dist] http://127.0.0.1:${PORT}`);
  console.log(`  ROOT=${ROOT}`);
  console.log(`  EFFECT=${EFFECT_FILE} exists=${fs.existsSync(EFFECT_FILE)}`);
  console.log(`  NATIVE_EXT=${NATIVE_EXT} exists=${fs.existsSync(NATIVE_EXT)}`);
});
