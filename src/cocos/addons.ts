import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** An npm package kurenai installs on demand (e.g. a platform's publishing tools). */
export type NpmAddon = {
  name: string;
  /** Env var that overrides the npm spec (version, tarball, or folder) for this addon. */
  specEnv?: string;
};

/** Outside the kurenai package so addons survive kurenai upgrades; override with KURENAI_ADDONS_DIR. */
export function addonsDir(): string {
  return process.env.KURENAI_ADDONS_DIR || join(homedir(), ".kurenai", "addons");
}

export function addonSpec(addon: NpmAddon): string {
  return (addon.specEnv && process.env[addon.specEnv]) || addon.name;
}

function stateFile(dir: string): string {
  return join(dir, ".kurenai-addons.json");
}

function readState(dir: string): Record<string, string> {
  const file = stateFile(dir);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, string>) : {};
}

function resolveInstalled(dir: string, name: string): string | undefined {
  try {
    return createRequire(join(dir, "package.json")).resolve(name);
  } catch {
    return undefined;
  }
}

function npmInstall(dir: string, spec: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      "npm",
      ["install", "--prefix", dir, "--omit=dev", "--no-audit", "--no-fund", spec],
      {
        cwd: dir,
        stdio: ["ignore", "ignore", "pipe"],
        env: { ...process.env, npm_config_progress: "false" },
        // npm is npm.cmd on Windows, which Node only runs through a shell.
        shell: process.platform === "win32",
      },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`npm install ${spec} failed (code=${String(code)}): ${stderr.trim().slice(-2000)}`));
    });
  });
}

/** Install the addon unless the same spec is already installed; returns its entry file. */
export async function ensureAddon(addon: NpmAddon): Promise<{ entry: string; installed: boolean }> {
  const dir = addonsDir();
  const spec = addonSpec(addon);
  const current = resolveInstalled(dir, addon.name);
  if (current && readState(dir)[addon.name] === spec) return { entry: current, installed: false };

  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, "package.json"))) {
    writeFileSync(join(dir, "package.json"), `${JSON.stringify({ name: "kurenai-addons", private: true }, null, 2)}\n`);
  }
  await npmInstall(dir, spec);
  const entry = resolveInstalled(dir, addon.name);
  if (!entry) throw new Error(`npm installed ${spec} but ${addon.name} does not resolve from ${dir}`);
  writeFileSync(stateFile(dir), `${JSON.stringify({ ...readState(dir), [addon.name]: spec }, null, 2)}\n`);
  return { entry, installed: true };
}

export async function loadAddon<T>(addon: NpmAddon): Promise<T> {
  const { entry } = await ensureAddon(addon);
  return (await import(pathToFileURL(entry).href)) as T;
}
