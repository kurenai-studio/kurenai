/**
 * Programmatic publish API for Kurenai / agents.
 */
import path from 'path';
import { buildPublishIR } from './lib/ir.mjs';
import { listPlatformPlugins, resolvePlatformChain } from './platforms/registry.mjs';

/**
 * @param {{
 *   projectRoot: string,
 *   platform?: string,
 *   outDir?: string,
 *   skipPacker?: boolean,
 *   log?: (msg: string) => void,
 * }} opts
 */
export async function publishProject(opts) {
  const platform = opts.platform || 'web';
  const projectRoot = path.resolve(opts.projectRoot);
  const outDir = path.resolve(opts.outDir || path.join(projectRoot, 'dist', platform));
  const log = opts.log || (() => {});

  if (!listPlatformPlugins().includes(platform)) {
    return {
      ok: false,
      error: `Unknown platform ${platform}. Known: ${listPlatformPlugins().join(', ')}`,
      platforms: listPlatformPlugins(),
    };
  }

  const ir = await buildPublishIR({
    projectRoot,
    skipPacker: !!opts.skipPacker,
  });

  const chain = resolvePlatformChain(platform);
  let last = null;
  for (const plugin of chain) {
    const dest =
      plugin.id === platform ? outDir : path.join(path.dirname(outDir), `.ir-${plugin.id}`);
    last = await plugin.emit(ir, { outDir: dest, log });
    if (!last.ok) {
      return {
        ok: false,
        platform,
        error: last.error,
        warnings: last.warnings,
        ir: summarizeIr(ir),
      };
    }
  }

  return {
    ok: true,
    platform,
    outDir: last.outDir,
    warnings: last.warnings || [],
    ir: summarizeIr(ir),
  };
}

function summarizeIr(ir) {
  return {
    projectRoot: ir.projectRoot,
    launchScene: ir.launchScene,
    bundles: ir.bundles.map((b) => b.name),
    scriptsRoot: ir.scriptsRoot,
    engineKit: ir.engineKit,
  };
}

export { listPlatformPlugins, buildPublishIR };
