#!/usr/bin/env node
/**
 * WeChat mini-game publishing for Cocos builds.
 *
 *   kurenai-wechat check <buildDir> [--virtual-payment]
 *   kurenai-wechat propose-subpackages <projectDir> [--limit <n>] [--min-bytes <n>]
 *   kurenai-wechat subpackage <projectDir> <assetFolder>... [--priority <n>] [--remove]
 *   kurenai-wechat preview <buildDir> [--qrcode <file>] [credentials] [--desc <text>] [--robot <1-30>]
 *   kurenai-wechat upload <buildDir> --version <x.y.z> [credentials] [--desc <text>] [--robot <1-30>]
 *   kurenai-wechat plugin info|install <cocosCliRoot>
 *
 * credentials: --appid <wx...> --private-key <file>, or env WECHAT_MINIGAME_APPID +
 * WECHAT_MINIGAME_PRIVATE_KEY_PATH (or WECHAT_MINIGAME_PRIVATE_KEY with the key content).
 */
import {
  checkPackageSize,
  configureSubpackages,
  installPlugin,
  pluginInfo,
  preview,
  proposeSubpackages,
  removeSubpackages,
  upload,
} from '../lib/index.js';

const USAGE = `usage:
  kurenai-wechat check <buildDir> [--virtual-payment]
  kurenai-wechat propose-subpackages <projectDir> [--limit <n>] [--min-bytes <n>]
  kurenai-wechat subpackage <projectDir> <assetFolder>... [--priority <n>] [--remove]
  kurenai-wechat preview <buildDir> [--qrcode <file>] [--appid <wx...>] [--private-key <file>] [--desc <text>] [--robot <1-30>]
  kurenai-wechat upload <buildDir> --version <x.y.z> [--appid <wx...>] [--private-key <file>] [--desc <text>] [--robot <1-30>]
  kurenai-wechat plugin info|install <cocosCliRoot>

The build dir is a Cocos wechatgame output (contains game.json). Credentials default to
WECHAT_MINIGAME_APPID and WECHAT_MINIGAME_PRIVATE_KEY_PATH.
Engine-module cuts live in kurenai (\`kurenai engine propose-cuts\`), not this CLI.`;

const VALUE_FLAGS = new Set([
  '--appid',
  '--private-key',
  '--qrcode',
  '--desc',
  '--robot',
  '--version',
  '--priority',
  '--limit',
  '--min-bytes',
]);

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (VALUE_FLAGS.has(arg)) {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      flags[arg.slice(2)] = value;
    } else if (arg.startsWith('--')) {
      flags[arg.slice(2)] = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function need(value, what) {
  if (!value) throw new Error(`missing ${what}\n\n${USAGE}`);
  return value;
}

function ciOptions(flags) {
  return {
    ...(flags.appid ? { appid: flags.appid } : {}),
    ...(flags['private-key'] ? { privateKeyPath: flags['private-key'] } : {}),
    ...(flags.desc ? { desc: flags.desc } : {}),
    ...(flags.robot ? { robot: Number(flags.robot) } : {}),
    ...(flags['virtual-payment'] ? { virtualPayment: true } : {}),
    onProgress: (message) => process.stderr.write(`${message}\n`),
  };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parse(rest);
  if (!command || command === 'help' || flags.help) {
    console.log(USAGE);
    return 0;
  }
  let result;
  switch (command) {
    case 'check':
      result = checkPackageSize(need(positional[0], '<buildDir>'), {
        ...(flags['virtual-payment'] ? { virtualPayment: true } : {}),
      });
      break;
    case 'propose-subpackages':
      result = {
        ok: true,
        ...proposeSubpackages(need(positional[0], '<projectDir>'), {
          ...(flags.limit ? { limit: Number(flags.limit) } : {}),
          ...(flags['min-bytes'] ? { minBytes: Number(flags['min-bytes']) } : {}),
        }),
      };
      break;
    case 'subpackage': {
      const project = need(positional[0], '<projectDir>');
      const folders = positional.slice(1);
      result = flags.remove
        ? { ok: true, project, removed: removeSubpackages(project, folders) }
        : {
            ok: true,
            ...configureSubpackages(project, folders, flags.priority ? { priority: Number(flags.priority) } : {}),
          };
      break;
    }
    case 'preview':
      result = await preview(need(positional[0], '<buildDir>'), {
        ...ciOptions(flags),
        ...(flags.qrcode ? { qrcodeOutput: flags.qrcode } : {}),
      });
      break;
    case 'upload':
      result = await upload(need(positional[0], '<buildDir>'), {
        ...ciOptions(flags),
        version: need(flags.version, '--version'),
      });
      break;
    case 'plugin':
      if (positional[0] === 'info') result = { ok: true, ...pluginInfo() };
      else if (positional[0] === 'install') result = { ok: true, ...installPlugin(need(positional[1], '<cocosCliRoot>')) };
      else throw new Error(`unknown plugin action: ${positional[0] ?? ''}\n\n${USAGE}`);
      break;
    default:
      throw new Error(`unknown command: ${command}\n\n${USAGE}`);
  }
  console.log(JSON.stringify(result, null, 2));
  return result.ok === false ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    const output = { ok: false, error: error instanceof Error ? error.message : String(error) };
    if (error && typeof error === 'object' && 'size' in error) output.size = error.size;
    console.error(JSON.stringify(output, null, 2));
    process.exit(1);
  },
);
