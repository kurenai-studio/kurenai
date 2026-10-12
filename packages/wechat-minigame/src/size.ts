import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { sizeHints, type SizeHint } from "./hints.js";

const MiB = 1024 * 1024;

/** WeChat mini-game code package limits (developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage). */
export const WECHAT_LIMITS = {
  mainBytes: 4 * MiB,
  independentSubpackageBytes: 4 * MiB,
  totalBytes: 20 * MiB,
  /** Games with virtual payment enabled get 30 MB in total. */
  totalBytesWithVirtualPayment: 30 * MiB,
} as const;

/** Files the WeChat tooling never ships. */
const NOT_SHIPPED = new Set(["project.config.json", "project.private.config.json"]);

export type SubpackageSize = {
  name: string;
  root: string;
  independent: boolean;
  bytes: number;
  files: number;
};

export type PackageSizeReport = {
  ok: boolean;
  buildDir: string;
  limits: { mainBytes: number; independentSubpackageBytes: number; totalBytes: number };
  main: { bytes: number; files: number; largest: Array<{ path: string; bytes: number }> };
  subpackages: SubpackageSize[];
  totalBytes: number;
  violations: string[];
  /** Engine-module and asset-folder attributions for slim workflows. */
  hints: SizeHint[];
};

type GameJson = {
  subpackages?: Array<{ name?: string; root?: string; independent?: boolean }>;
  subPackages?: Array<{ name?: string; root?: string; independent?: boolean }>;
};

export function readGameJson(buildDir: string): GameJson {
  const file = join(buildDir, "game.json");
  if (!existsSync(file)) {
    throw new Error(`Not a WeChat mini-game build (no game.json): ${buildDir}`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as GameJson;
}

function listFiles(dir: string, out: Array<{ path: string; bytes: number }> = [], root = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out, root);
    else if (entry.isFile()) {
      out.push({ path: relative(root, full).split(sep).join("/"), bytes: statSync(full).size });
    }
  }
  return out;
}

function normalizeRoot(root: string): string {
  const trimmed = root.replace(/^\.?\//, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

const mb = (bytes: number) => `${(bytes / MiB).toFixed(2)} MB`;

/**
 * Measure a wechatgame build directory the way WeChat applies its limits: every file under
 * a `game.json` subpackage root counts towards that subpackage, everything else is the main package.
 */
export function checkPackageSize(
  buildDir: string,
  options: { virtualPayment?: boolean; largest?: number } = {},
): PackageSizeReport {
  const game = readGameJson(buildDir);
  const declared = game.subpackages ?? game.subPackages ?? [];
  const subpackages: SubpackageSize[] = declared
    .filter((entry) => typeof entry.root === "string" && entry.root.length > 0)
    .map((entry) => ({
      name: entry.name ?? entry.root!,
      root: normalizeRoot(entry.root!),
      independent: entry.independent === true,
      bytes: 0,
      files: 0,
    }));

  const mainFiles: Array<{ path: string; bytes: number }> = [];
  for (const file of listFiles(buildDir)) {
    if (NOT_SHIPPED.has(file.path)) continue;
    const owner = subpackages.find((pkg) => file.path.startsWith(pkg.root));
    if (owner) {
      owner.bytes += file.bytes;
      owner.files += 1;
    } else {
      mainFiles.push(file);
    }
  }

  const limits = {
    mainBytes: WECHAT_LIMITS.mainBytes,
    independentSubpackageBytes: WECHAT_LIMITS.independentSubpackageBytes,
    totalBytes: options.virtualPayment
      ? WECHAT_LIMITS.totalBytesWithVirtualPayment
      : WECHAT_LIMITS.totalBytes,
  };
  const mainBytes = mainFiles.reduce((sum, file) => sum + file.bytes, 0);
  const totalBytes = mainBytes + subpackages.reduce((sum, pkg) => sum + pkg.bytes, 0);

  const violations: string[] = [];
  if (mainBytes > limits.mainBytes) {
    violations.push(`main package ${mb(mainBytes)} exceeds ${mb(limits.mainBytes)}`);
  }
  for (const pkg of subpackages) {
    if (pkg.independent && pkg.bytes > limits.independentSubpackageBytes) {
      violations.push(
        `independent subpackage ${pkg.name} ${mb(pkg.bytes)} exceeds ${mb(limits.independentSubpackageBytes)}`,
      );
    }
  }
  if (totalBytes > limits.totalBytes) {
    violations.push(`total ${mb(totalBytes)} exceeds ${mb(limits.totalBytes)}`);
  }

  const largest = [...mainFiles].sort((a, b) => b.bytes - a.bytes).slice(0, options.largest ?? 10);
  const report: PackageSizeReport = {
    ok: violations.length === 0,
    buildDir,
    limits,
    main: { bytes: mainBytes, files: mainFiles.length, largest },
    subpackages,
    totalBytes,
    violations,
    hints: [],
  };
  report.hints = sizeHints(report);
  return report;
}
