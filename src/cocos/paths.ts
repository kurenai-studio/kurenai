import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Historical PinK full install (transitional fallback only). */
export const LEGACY_PINK_COCOS_CLI_ROOT = join(
  homedir(),
  "Library",
  "Application Support",
  "cocos-default",
  "cocos-4.0.0-alpha.33",
);

/** Default engine version for the trimmed kurenai-managed core pack. */
export const KURENAI_COCOS_CORE_VERSION = "4.0.0-alpha.33";

/** Kurenai-owned trimmed core install root (preferred). */
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

/**
 * @deprecated Use resolveCocosCliRoot(); kept as the legacy PinK path name for
 * older call sites / docs that still mention DEFAULT_COCOS_CLI_ROOT.
 */
export const DEFAULT_COCOS_CLI_ROOT = LEGACY_PINK_COCOS_CLI_ROOT;

function looksLikeCocosCli(root: string): boolean {
  return existsSync(join(root, "dist", "cli.js"));
}

/**
 * Resolve the cocos runtime root used by host / publish.
 *
 * Order:
 * 1. explicit `configured` or `KURENAI_COCOS_CLI_ROOT`
 * 2. kurenai-managed trimmed core (`…/kurenai/cocos-core/<version>`)
 * 3. legacy PinK full install (temporary bridge)
 */
export function resolveCocosCliRoot(configured?: string): string {
  if (configured) return resolve(configured);
  if (process.env.KURENAI_COCOS_CLI_ROOT) {
    return resolve(process.env.KURENAI_COCOS_CLI_ROOT);
  }
  const managed = managedCocosCoreRoot(
    process.env.KURENAI_COCOS_CORE_VERSION || KURENAI_COCOS_CORE_VERSION,
  );
  if (looksLikeCocosCli(managed)) return managed;
  return resolve(LEGACY_PINK_COCOS_CLI_ROOT);
}

// Source files live one level deeper than the bundled lib/index.js.
export function packageFile(relativePath: string): string {
  const candidates = [`../${relativePath}`, `../../${relativePath}`].map((candidate) =>
    fileURLToPath(new URL(candidate, import.meta.url)),
  );
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`Kurenai package file is missing: ${relativePath}`);
  return found;
}
