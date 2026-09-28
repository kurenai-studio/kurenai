import { existsSync, statSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { extractZip } from "./unzip.js";

const KURA_BASE = process.env.KURA_BASE_URL || "https://kuroneko.chat/assets";
const KIT_ID = /^[a-z0-9][a-z0-9._-]{1,63}$/;

// Engine-native exports, Blender sources and catalog thumbnails are not game assets.
const SKIP_DIRS = new Set(["native", "source", "previews", "thumbs", "__macosx", "node_modules"]);
const KINDS: Record<string, string> = {
  ".glb": "models",
  ".gltf": "models",
  ".bin": "models",
  ".wav": "audio",
  ".mp3": "audio",
  ".ogg": "audio",
  ".m4a": "audio",
};

export interface KitAddResult {
  ok: true;
  kit: string;
  resources: string;
  models: string[];
  audio: string[];
  readme?: string;
  skipped: number;
}

async function walk(dir: string, root = dir): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name.toLowerCase())) out.push(...(await walk(path, root)));
    } else {
      out.push(relative(root, path));
    }
  }
  return out;
}

async function unzip(zip: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "kurenai-kit-"));
  await extractZip(zip, dir);
  return dir;
}

/** Downloads a Kura studio pack (public read) and returns the zip path. */
async function fetchKuraPack(id: string): Promise<string> {
  const plan = await (await fetch(`${KURA_BASE}/api/fetch?providerId=studio&externalId=${encodeURIComponent(id)}`)).json();
  const url: string =
    plan?.files?.find((f: { url?: string }) => f.url?.includes("pack.zip"))?.url ??
    plan?.acquireHint?.zipUrl ??
    `${KURA_BASE}/api/studio-file?externalId=${encodeURIComponent(id)}&path=pack.zip`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kura pack "${id}" not found (${response.status} ${url})`);
  const zip = join(await mkdtemp(join(tmpdir(), "kurenai-kit-")), `${id}.zip`);
  await writeFile(zip, Buffer.from(await response.arrayBuffer()));
  return zip;
}

/** A zip may wrap everything in one top-level folder. */
async function packRoot(dir: string): Promise<string> {
  const entries = (await readdir(dir)).filter((name) => name !== "__MACOSX");
  if (entries.length === 1 && statSync(join(dir, entries[0]!)).isDirectory()) return join(dir, entries[0]!);
  return dir;
}

async function ignorePatterns(root: string): Promise<RegExp[]> {
  try {
    const spec = JSON.parse(await readFile(join(root, "kura-pack.json"), "utf8"));
    return Array.isArray(spec.ignore) ? spec.ignore.map((p: string) => new RegExp(p)) : [];
  } catch {
    return [];
  }
}

/**
 * Copies a kit's web assets into assets/resources/kits/<kit>/{models,audio}/ so that
 * `loadModel('kits/<kit>/models/<Name>')` works. Accepts a folder, a .zip, or a Kura
 * studio pack id (e.g. `ks-survivor-kit`).
 */
export async function addKit(projectPath: string, source: string, name?: string): Promise<KitAddResult> {
  const cleanup: string[] = [];
  try {
    let root: string;
    let kit: string;
    const local = resolve(source);
    if (existsSync(local) && statSync(local).isDirectory()) {
      root = local;
      kit = name ?? basename(local);
    } else if (existsSync(local) && extname(local).toLowerCase() === ".zip") {
      const dir = await unzip(local);
      cleanup.push(dir);
      root = await packRoot(dir);
      kit = name ?? basename(local, ".zip");
    } else if (KIT_ID.test(source)) {
      const zip = await fetchKuraPack(source);
      cleanup.push(dirname(zip));
      const dir = await unzip(zip);
      cleanup.push(dir);
      root = await packRoot(dir);
      kit = name ?? source;
    } else {
      throw new Error(`kit source must be a folder, a .zip or a Kura pack id: ${source}`);
    }
    if (!KIT_ID.test(kit)) throw new Error(`kit name must match ${KIT_ID}: ${kit} (pass --name)`);

    const ignore = await ignorePatterns(root);
    const resources = join("assets", "resources", "kits", kit);
    const models: string[] = [];
    const audio: string[] = [];
    let skipped = 0;
    for (const file of await walk(root)) {
      const kind = KINDS[extname(file).toLowerCase()];
      if (!kind || ignore.some((re) => re.test(basename(file)))) {
        skipped += 1;
        continue;
      }
      // Keep a model's folder layout below its top-level dir so .gltf -> .bin/texture links hold.
      const parts = file.split(sep);
      const inner = parts.length > 1 ? parts.slice(1).join(sep) : file;
      const target = join(projectPath, resources, kind, inner);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(join(root, file), target);
      const resPath = join("kits", kit, kind, inner).split(sep).join("/").replace(/\.[^.]+$/, "");
      if (kind === "models" && extname(file).toLowerCase() !== ".bin") models.push(resPath);
      if (kind === "audio") audio.push(resPath);
    }
    if (!models.length && !audio.length) throw new Error(`no .glb/.gltf or audio files found in ${source}`);

    let readme: string | undefined;
    for (const candidate of ["README.md", "readme.md", "README.txt"]) {
      if (existsSync(join(root, candidate))) {
        readme = join("docs", "kits", `${kit}.md`);
        await mkdir(join(projectPath, "docs", "kits"), { recursive: true });
        await copyFile(join(root, candidate), join(projectPath, readme));
        break;
      }
    }
    return {
      ok: true,
      kit,
      resources: resources.split(sep).join("/"),
      models,
      audio,
      ...(readme ? { readme: readme.split(sep).join("/") } : {}),
      skipped,
    };
  } finally {
    for (const dir of cleanup) await rm(dir, { recursive: true, force: true });
  }
}
