import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

export interface MetaSubAsset {
  uuid: string;
  name?: string;
  importer?: string;
}

export interface MetaAssetInfo {
  path: string;
  url: string;
  uuid: string;
  importer: string;
  imported: boolean;
  subAssets: MetaSubAsset[];
}

interface RawMeta {
  uuid?: string;
  importer?: string;
  imported?: boolean;
  name?: string;
  subMetas?: Record<string, RawMeta>;
}

/** Absolute path of `file` if it lies inside `<project>/assets`, else undefined. */
export function assetPathInProject(project: string, file: string): string | undefined {
  const assetsDir = join(resolve(project), "assets");
  const target = resolve(file);
  if (target !== assetsDir && !target.startsWith(assetsDir + sep)) return undefined;
  return target;
}

/**
 * Reads uuid / importer / sub-assets from an existing `.meta` without starting the
 * host. Throws when the file has not been imported yet.
 */
export async function readAssetInfo(project: string, file: string): Promise<MetaAssetInfo> {
  const target = assetPathInProject(project, file);
  if (!target) throw new Error(`path must be inside ${join(resolve(project), "assets")}`);
  if (!existsSync(target)) throw new Error(`no such file: ${relative(project, target)}`);
  const metaPath = `${target}.meta`;
  if (!existsSync(metaPath)) {
    throw new Error(
      `not imported yet (no .meta): run \`kurenai import ${relative(process.cwd(), target) || target}\``,
    );
  }
  const meta = JSON.parse(await readFile(metaPath, "utf8")) as RawMeta;
  if (!meta.uuid) throw new Error(`${relative(project, metaPath)} has no uuid`);

  const subAssets: MetaSubAsset[] = [];
  const collect = (subMetas: Record<string, RawMeta> | undefined) => {
    for (const sub of Object.values(subMetas ?? {})) {
      if (sub.uuid) {
        subAssets.push({
          uuid: sub.uuid,
          ...(sub.name ? { name: sub.name } : {}),
          ...(sub.importer ? { importer: sub.importer } : {}),
        });
      }
      collect(sub.subMetas);
    }
  };
  collect(meta.subMetas);

  const rel = relative(resolve(project), target).split(sep).join("/");
  return {
    path: rel,
    url: `db://${rel}`,
    uuid: meta.uuid,
    importer: meta.importer ?? "unknown",
    imported: meta.imported !== false,
    subAssets,
  };
}

/** Files under `path` (or `path` itself), skipping `.meta` and dotfiles. */
export function listImportTargets(path: string): string[] {
  const target = resolve(path);
  if (!statSync(target).isDirectory()) return [target];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name.endsWith(".meta")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  walk(target);
  return files.sort();
}
