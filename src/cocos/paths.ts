import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_COCOS_CLI_ROOT = join(
  homedir(),
  "Library",
  "Application Support",
  "cocos-default",
  "cocos-4.0.0-alpha.33",
);

export function resolveCocosCliRoot(configured?: string): string {
  return resolve(configured ?? process.env.KURENAI_COCOS_CLI_ROOT ?? DEFAULT_COCOS_CLI_ROOT);
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
