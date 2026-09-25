import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const CLI_BOOLEAN_FLAGS = new Set(["errors", "verbose", "fetch"]);

export type CliOptions = Record<string, string | true>;

export function parseArgs(argv: string[]): {
  positional: string[];
  options: CliOptions;
} {
  const positional: string[] = [];
  const options: CliOptions = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) positional.push(arg);
    else if (CLI_BOOLEAN_FLAGS.has(arg.slice(2))) options[arg.slice(2)] = true;
    else {
      const value = argv[++i];
      if (value !== undefined) options[arg.slice(2)] = value;
    }
  }
  return { positional, options };
}

export function findProject(from: string): string | undefined {
  let dir = resolve(from);
  if (existsSync(dir) && statSync(dir).isFile()) dir = dirname(dir);
  for (;;) {
    if (existsSync(join(dir, "assets")) && existsSync(join(dir, "package.json")))
      return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function resolveProjectDir(
  options: CliOptions,
  hint?: string,
  cwd: string = process.cwd(),
): string {
  const project =
    typeof options.project === "string"
      ? resolve(options.project)
      : findProject(hint ?? cwd);
  if (!project || !existsSync(join(project, "assets"))) {
    throw new Error("no Cocos project found; pass --project <dir>");
  }
  return project;
}

export function wantsHelp(argv: string[]): boolean {
  return argv[0] === "help" || argv.includes("--help") || argv.includes("-h");
}
