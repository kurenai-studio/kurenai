#!/usr/bin/env node
/**
 * Build one Cocos project through the cocos core launcher.
 *
 * Same as `cocos build`, without the cocos-cli command layer (dist/cli.js,
 * commander, …), which the slim vendor tree does not ship.
 *
 * usage: kurenai-cocos-build.mjs --project <dir> --platform <id> [--build-config <file>]
 *
 * env:
 *   KURENAI_COCOS_CLI_ROOT   override cocos core root (default: vendor/cocos-core inside the kurenai package)
 *
 * Prints `Build Dest: <dest>` on success and exits with the builder's exit code.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project') options.project = argv[++i];
    else if (arg === '--platform') options.platform = argv[++i];
    else if (arg === '--build-config') options.buildConfig = argv[++i];
    else fail(`unknown arg: ${arg}`);
  }
  if (!options.project || !options.platform) {
    fail('usage: kurenai-cocos-build.mjs --project <dir> --platform <id> [--build-config <file>]');
  }
  return options;
}

const args = parseArgs(process.argv.slice(2));
const project = resolve(args.project);
const { resolveCocosCliRoot } = await import('../lib/index.js');
const cliRoot = resolveCocosCliRoot();

if (!existsSync(join(project, 'package.json'))) fail(`not a Cocos project: ${project}`);
if (!existsSync(join(cliRoot, 'dist/core/launcher.js'))) fail(`cocos-cli not found: ${cliRoot}`);

// cocos-cli exits 34 (BuildExitCode.BUILD_FAILED) for a missing config file.
const config = args.buildConfig
  ? existsSync(args.buildConfig)
    ? JSON.parse(readFileSync(args.buildConfig, 'utf8'))
    : fail(`config: ${args.buildConfig} is not exist!`, 34)
  : {};
const options = { ...config, project, platform: args.platform };

const cliRequire = createRequire(join(cliRoot, 'package.json'));
const { default: Launcher } = cliRequire(join(cliRoot, 'dist/core/launcher'));

try {
  const result = await new Launcher(project).build(args.platform, options);
  if (result.code === 0) console.log(`Build completed successfully! Build Dest: ${result.dest}`);
  else console.error('Build failed!');
  process.exit(result.code);
} catch (error) {
  console.error('Failed to build project:', error);
  process.exit(1);
}
