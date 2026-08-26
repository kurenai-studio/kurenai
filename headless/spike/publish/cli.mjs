#!/usr/bin/env node
/**
 * Headless publish CLI.
 *
 *   node spike/publish/cli.mjs --project <dir> [--platform web] [--out <dir>] [--skip-packer]
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPublishIR } from './lib/ir.mjs';
import { listPlatformPlugins, resolvePlatformChain } from './platforms/registry.mjs';

function parseArgs(argv) {
  const out = { platform: 'web' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--project' && next) {
      out.project = next;
      i++;
    } else if (a.startsWith('--project=')) out.project = a.slice(10);
    else if (a === '--platform' && next) {
      out.platform = next;
      i++;
    } else if (a.startsWith('--platform=')) out.platform = a.slice(11);
    else if (a === '--out' && next) {
      out.out = next;
      i++;
    } else if (a.startsWith('--out=')) out.out = a.slice(6);
    else if (a === '--skip-packer') out.skipPacker = true;
    else if (a === '--list-platforms') out.list = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function usage() {
  return `Usage: node spike/publish/cli.mjs --project <dir> [--platform web] [--out <dir>] [--skip-packer]

Platforms: ${listPlatformPlugins().join(', ')}
`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  if (args.list) {
    process.stdout.write(listPlatformPlugins().join('\n') + '\n');
    return;
  }
  const project = args.project || process.env.PROJECT;
  if (!project) {
    console.error(usage());
    process.exit(2);
  }
  const projectRoot = path.resolve(project);
  const outDir = path.resolve(
    args.out || path.join(projectRoot, 'dist', args.platform || 'web'),
  );

  console.log(`[publish] project=${projectRoot}`);
  console.log(`[publish] platform=${args.platform}`);
  console.log(`[publish] building IR…`);
  const ir = await buildPublishIR({
    projectRoot,
    skipPacker: !!args.skipPacker,
  });
  console.log(
    `[publish] IR ok launchScene=${ir.launchScene || '(none)'} bundles=${ir.bundles.map((b) => b.name).join(',') || '(none)'}`,
  );

  const chain = resolvePlatformChain(args.platform);
  let last = null;
  for (const plugin of chain) {
    const dest = plugin.id === args.platform ? outDir : path.join(outDir, `../.ir-${plugin.id}`);
    console.log(`[publish] emit platform=${plugin.id} → ${dest}`);
    last = await plugin.emit(ir, {
      outDir: dest,
      log: (m) => console.log(`[publish:${plugin.id}] ${m}`),
    });
    if (!last.ok) {
      console.error(`[publish] FAILED: ${last.error}`);
      if (last.warnings?.length) console.error(last.warnings.join('\n'));
      process.exit(1);
    }
    if (last.warnings?.length) {
      for (const w of last.warnings) console.warn(`[publish:warn] ${w}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        platform: args.platform,
        outDir: last.outDir,
        launchScene: ir.launchScene,
        bundles: ir.bundles.map((b) => b.name),
        warnings: last.warnings || [],
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error('[publish] FATAL', e);
    process.exit(1);
  });
}

export { main as publishMain, buildPublishIR };
