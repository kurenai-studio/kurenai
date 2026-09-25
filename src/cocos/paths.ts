import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Default engine version for the bundled cocos runtime. */
export const KURENAI_COCOS_CORE_VERSION = "4.0.0-alpha.33";

/**
 * @deprecated PinK path — maintainer pack source only. Runtime never resolves here.
 */
export const LEGACY_PINK_COCOS_CLI_ROOT = join(
  homedir(),
  "Library",
  "Application Support",
  "cocos-default",
  "cocos-4.0.0-alpha.33",
);

/** Absolute path to the kurenai package root (repo or installed package). */
export function packageRoot(): string {
  const fromLib = fileURLToPath(new URL("..", import.meta.url));
  const fromSrc = fileURLToPath(new URL("../..", import.meta.url));
  if (existsSync(join(fromLib, "package.json"))) return fromLib;
  if (existsSync(join(fromSrc, "package.json"))) return fromSrc;
  throw new Error("Cannot locate kurenai package root");
}

/** Trimmed cocos runtime source tree shipped inside the kurenai package. */
export function bundledCocosCoreRoot(): string {
  return join(packageRoot(), "vendor", "cocos-core");
}

/**
 * @deprecated Application Support cache — no longer the default.
 */
export function managedCocosCoreRoot(
  version: string = KURENAI_COCOS_CORE_VERSION,
): string {
  return join(
    homedir(),
    "Library",
    "Application Support",
    "kurenai",
    "cocos-core",
    version,
  );
}

/** Default runtime = vendor/cocos-core source tree. */
export const DEFAULT_COCOS_CLI_ROOT = bundledCocosCoreRoot();

/**
 * Resolve the cocos runtime root used by project / assets / preview / build.
 *
 * Order:
 * 1. explicit `configured`
 * 2. `KURENAI_COCOS_CLI_ROOT` (tests / override)
 * 3. bundled `vendor/cocos-core` inside the kurenai package
 */
export function resolveCocosCliRoot(configured?: string): string {
  if (configured) return resolve(configured);
  if (process.env.KURENAI_COCOS_CLI_ROOT) {
    return resolve(process.env.KURENAI_COCOS_CLI_ROOT);
  }
  return bundledCocosCoreRoot();
}

export function looksLikeCocosCli(root: string): boolean {
  return existsSync(join(root, "dist", "cli.js"));
}

export function packageFile(relativePath: string): string {
  const full = join(packageRoot(), relativePath);
  if (!existsSync(full)) {
    throw new Error(`Kurenai package file is missing: ${relativePath}`);
  }
  return full;
}
