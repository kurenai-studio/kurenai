import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { checkPackageSize, type PackageSizeReport } from "./size.js";

export type Credentials = {
  appid: string;
  /** Path to the code upload key downloaded from the WeChat admin console. */
  privateKeyPath?: string;
  /** Key content, for CI secrets that are not files. */
  privateKey?: string;
};

export type CiOptions = {
  appid?: string;
  privateKeyPath?: string;
  env?: NodeJS.ProcessEnv;
  /** 1–30; WeChat tracks dev versions per robot. */
  robot?: number;
  desc?: string;
  virtualPayment?: boolean;
  onProgress?: (message: string) => void;
  /** Injected in tests; defaults to require("miniprogram-ci"). */
  ci?: MiniprogramCi;
};

type SubPackageInfo = Array<{ name: string; size: number }>;

export type MiniprogramCi = {
  Project: new (options: Record<string, unknown>) => unknown;
  preview: (options: Record<string, unknown>) => Promise<{ subPackageInfo?: SubPackageInfo }>;
  upload: (options: Record<string, unknown>) => Promise<{ subPackageInfo?: SubPackageInfo }>;
};

const PLACEHOLDER_APPIDS = new Set(["", "touristappid", "wx0000000000000000"]);

function projectConfigFile(buildDir: string): string {
  return join(buildDir, "project.config.json");
}

function readProjectAppid(buildDir: string): string | undefined {
  const file = projectConfigFile(buildDir);
  if (!existsSync(file)) return undefined;
  const appid = (JSON.parse(readFileSync(file, "utf8")) as { appid?: unknown }).appid;
  return typeof appid === "string" && !PLACEHOLDER_APPIDS.has(appid) ? appid : undefined;
}

/** Options first, then WECHAT_MINIGAME_* env, then the appid already in project.config.json. */
export function resolveCredentials(buildDir: string, options: CiOptions = {}): Credentials {
  const env = options.env ?? process.env;
  const appid = options.appid || env.WECHAT_MINIGAME_APPID || readProjectAppid(buildDir);
  if (!appid) {
    throw new Error(
      "Missing WeChat appid: pass --appid, set WECHAT_MINIGAME_APPID, or put it in project.config.json",
    );
  }
  const privateKeyPath = options.privateKeyPath || env.WECHAT_MINIGAME_PRIVATE_KEY_PATH;
  const privateKey = env.WECHAT_MINIGAME_PRIVATE_KEY;
  if (privateKeyPath) {
    const keyPath = resolve(privateKeyPath);
    if (!existsSync(keyPath)) throw new Error(`WeChat upload key not found: ${keyPath}`);
    return { appid, privateKeyPath: keyPath };
  }
  if (privateKey) return { appid, privateKey };
  throw new Error(
    "Missing WeChat code upload key: pass --private-key <file>, or set WECHAT_MINIGAME_PRIVATE_KEY_PATH " +
      "(or WECHAT_MINIGAME_PRIVATE_KEY with the key content). Download it from the mini-game admin console " +
      "(开发管理 → 开发设置 → 小程序代码上传) and add this machine's IP to the whitelist.",
  );
}

/** Write the appid into project.config.json so the build also opens correctly in WeChat DevTools. */
export function setProjectAppid(buildDir: string, appid: string): void {
  const file = projectConfigFile(buildDir);
  const config = existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>)
    : { compileType: "game" };
  if (config.appid === appid) return;
  config.appid = appid;
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

function loadCi(options: CiOptions): MiniprogramCi {
  if (options.ci) return options.ci;
  return createRequire(import.meta.url)("miniprogram-ci") as MiniprogramCi;
}

function prepare(buildDir: string, options: CiOptions) {
  const dir = resolve(buildDir);
  const size = checkPackageSize(dir, options.virtualPayment ? { virtualPayment: true } : {});
  if (!size.ok) {
    throw Object.assign(new Error(`WeChat package limits exceeded: ${size.violations.join("; ")}`), { size });
  }
  const credentials = resolveCredentials(dir, options);
  setProjectAppid(dir, credentials.appid);
  const ci = loadCi(options);
  const project = new ci.Project({
    appid: credentials.appid,
    type: "miniGame",
    projectPath: dir,
    ...(credentials.privateKeyPath
      ? { privateKeyPath: credentials.privateKeyPath }
      : { privateKey: credentials.privateKey }),
    ignores: ["node_modules/**/*"],
  });
  const common = {
    project,
    // Cocos output is already transpiled and minified; keep WeChat from touching it again.
    setting: { useProjectConfig: true, es6: false, es7: false, minify: false, minifyJS: false },
    onProgressUpdate: (task: unknown) => options.onProgress?.(typeof task === "string" ? task : JSON.stringify(task)),
    ...(options.robot ? { robot: options.robot } : {}),
    ...(options.desc ? { desc: options.desc } : {}),
  };
  return { dir, size, appid: credentials.appid, ci, common };
}

export type CiResult = {
  ok: true;
  action: "preview" | "upload";
  appid: string;
  size: PackageSizeReport;
  subPackageInfo?: SubPackageInfo;
  qrcode?: string;
  version?: string;
};

/** Upload a dev build and write the preview QR code (scan with WeChat to run it on a phone). */
export async function preview(
  buildDir: string,
  options: CiOptions & { qrcodeOutput?: string } = {},
): Promise<CiResult> {
  const { dir, size, appid, ci, common } = prepare(buildDir, options);
  const qrcode = resolve(options.qrcodeOutput ?? join(dirname(dir), `${appid}-preview.jpg`));
  mkdirSync(dirname(qrcode), { recursive: true });
  const result = await ci.preview({ ...common, qrcodeFormat: "image", qrcodeOutputDest: qrcode });
  return {
    ok: true,
    action: "preview",
    appid,
    size,
    qrcode,
    ...(result.subPackageInfo ? { subPackageInfo: result.subPackageInfo } : {}),
  };
}

/** Upload as a dev version; promote it to trial/release in the admin console. */
export async function upload(
  buildDir: string,
  options: CiOptions & { version: string },
): Promise<CiResult> {
  if (!options.version) throw new Error("upload needs a version (e.g. --version 1.0.0)");
  const { size, appid, ci, common } = prepare(buildDir, options);
  const result = await ci.upload({ ...common, version: options.version });
  return {
    ok: true,
    action: "upload",
    appid,
    size,
    version: options.version,
    ...(result.subPackageInfo ? { subPackageInfo: result.subPackageInfo } : {}),
  };
}
