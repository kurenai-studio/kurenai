//#region src/hints.d.ts
/**
 * Attribution from a WeChat build size report. kurenai consumes `engine-module` hints
 * via proposeEngineCuts({ artifacts }); this package applies `asset-folder` hints via
 * configureSubpackages.
 */
type SizeHint = {
  kind: "engine-module";
  /** Engine includeModules id when known; otherwise empty and evidence is the artifact path. */
  module: string;
  evidence: string;
  bytes: number;
} | {
  kind: "asset-folder";
  /** Path relative to the build dir, e.g. assets/levels/ */
  folder: string;
  bytes: number;
};
/**
 * Turn a size report into actionable hints: engine artifacts in the main package, and
 * top-level `assets/<folder>/` trees that can move into WeChat subpackages.
 */
declare function sizeHints(report: PackageSizeReport): SizeHint[];
//#endregion
//#region src/size.d.ts
/** WeChat mini-game code package limits (developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage). */
declare const WECHAT_LIMITS: {
  readonly mainBytes: number;
  readonly independentSubpackageBytes: number;
  readonly totalBytes: number;
  /** Games with virtual payment enabled get 30 MB in total. */
  readonly totalBytesWithVirtualPayment: number;
};
type SubpackageSize = {
  name: string;
  root: string;
  independent: boolean;
  bytes: number;
  files: number;
};
type PackageSizeReport = {
  ok: boolean;
  buildDir: string;
  limits: {
    mainBytes: number;
    independentSubpackageBytes: number;
    totalBytes: number;
  };
  main: {
    bytes: number;
    files: number;
    largest: Array<{
      path: string;
      bytes: number;
    }>;
  };
  subpackages: SubpackageSize[];
  totalBytes: number;
  violations: string[];
  /** Engine-module and asset-folder attributions for slim workflows. */
  hints: SizeHint[];
};
type GameJson = {
  subpackages?: Array<{
    name?: string;
    root?: string;
    independent?: boolean;
  }>;
  subPackages?: Array<{
    name?: string;
    root?: string;
    independent?: boolean;
  }>;
};
declare function readGameJson(buildDir: string): GameJson;
/**
 * Measure a wechatgame build directory the way WeChat applies its limits: every file under
 * a `game.json` subpackage root counts towards that subpackage, everything else is the main package.
 */
declare function checkPackageSize(buildDir: string, options?: {
  virtualPayment?: boolean;
  largest?: number;
}): PackageSizeReport;
//#endregion
//#region src/subpackage.d.ts
/** Bundle config preset this package owns in the project's builder settings. */
declare const SUBPACKAGE_CONFIG_ID = "kurenai_wechat_subpackage";
/**
 * WeChat builds the bundle as a mini-game subpackage; every other platform keeps the
 * default merge_dep bundle. `overwrite` mode means "use overwriteSettings[platform], else merge_dep".
 */
declare const SUBPACKAGE_BUNDLE_CONFIG: {
  readonly displayName: "WeChat subpackage (kurenai-wechat)";
  readonly configs: {
    readonly native: {
      readonly preferredOptions: {
        readonly isRemote: false;
        readonly compressionType: "merge_dep";
      };
    };
    readonly web: {
      readonly preferredOptions: {
        readonly isRemote: false;
        readonly compressionType: "merge_dep";
      };
      readonly fallbackOptions: {
        readonly compressionType: "merge_dep";
      };
    };
    readonly miniGame: {
      readonly configMode: "overwrite";
      readonly overwriteSettings: {
        readonly wechatgame: {
          readonly isRemote: false;
          readonly compressionType: "subpackage";
        };
      };
    };
  };
};
type CreatorLine = "3.8" | "4";
type SubpackageResult = {
  project: string;
  creator: CreatorLine;
  settingsFile: string;
  bundles: Array<{
    folder: string;
    bundleName: string;
    metaCreated: boolean;
  }>;
};
declare function detectCreatorLine(project: string): CreatorLine;
/**
 * Turn asset folders into Asset Bundles that WeChat builds as subpackages
 * (output under `subpackages/<bundleName>/`, listed in game.json). Idempotent.
 */
declare function configureSubpackages(projectDir: string, folders: string[], options?: {
  priority?: number;
}): SubpackageResult;
/** Undo configureSubpackages for the given folders (the bundle preset stays in settings). */
declare function removeSubpackages(projectDir: string, folders: string[]): string[];
//#endregion
//#region src/propose-subpackages.d.ts
type SubpackageCandidate = {
  /** Project-relative folder, e.g. assets/levels */
  folder: string;
  bytes: number;
  files: number;
  /** Already marked isBundle in the folder .meta */
  alreadyBundle: boolean;
};
type ProposeSubpackagesResult = {
  project: string;
  candidates: SubpackageCandidate[];
  /** Folders not yet bundles, largest first — ready for configureSubpackages. */
  suggested: string[];
};
/**
 * Rank top-level `assets/*` folders by on-disk size as WeChat subpackage candidates.
 * Engine/cocos-js weight is out of scope — that is kurenai's proposeEngineCuts.
 */
declare function proposeSubpackages(projectDir: string, options?: {
  limit?: number;
  minBytes?: number;
}): ProposeSubpackagesResult;
//#endregion
//#region src/ci.d.ts
type Credentials = {
  appid: string;
  /** Path to the code upload key downloaded from the WeChat admin console. */
  privateKeyPath?: string;
  /** Key content, for CI secrets that are not files. */
  privateKey?: string;
};
type CiOptions = {
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
type SubPackageInfo = Array<{
  name: string;
  size: number;
}>;
type MiniprogramCi = {
  Project: new (options: Record<string, unknown>) => unknown;
  preview: (options: Record<string, unknown>) => Promise<{
    subPackageInfo?: SubPackageInfo;
  }>;
  upload: (options: Record<string, unknown>) => Promise<{
    subPackageInfo?: SubPackageInfo;
  }>;
};
/** Options first, then WECHAT_MINIGAME_* env, then the appid already in project.config.json. */
declare function resolveCredentials(buildDir: string, options?: CiOptions): Credentials;
/** Write the appid into project.config.json so the build also opens correctly in WeChat DevTools. */
declare function setProjectAppid(buildDir: string, appid: string): void;
type CiResult = {
  ok: true;
  action: "preview" | "upload";
  appid: string;
  size: PackageSizeReport;
  subPackageInfo?: SubPackageInfo;
  qrcode?: string;
  version?: string;
};
/** Upload a dev build and write the preview QR code (scan with WeChat to run it on a phone). */
declare function preview(buildDir: string, options?: CiOptions & {
  qrcodeOutput?: string;
}): Promise<CiResult>;
/** Upload as a dev version; promote it to trial/release in the admin console. */
declare function upload(buildDir: string, options: CiOptions & {
  version: string;
}): Promise<CiResult>;
//#endregion
//#region src/plugin.d.ts
type PluginMarker = {
  id: string;
  platform: string;
  pluginVersion: string;
  engineVersion: string;
};
/** The bundled Cocos 4 wechatgame builder plugin (Creator 3.8 ships its own). */
declare function pluginInfo(): PluginMarker & {
  dir: string;
};
/**
 * Install the plugin into a cocos-cli root as packages/platforms/wechat, where the builder
 * discovers platform plugins. Refuses a cocos-cli whose engine version differs from the plugin's.
 */
declare function installPlugin(cocosCliRoot: string): {
  dir: string;
  engineVersion: string;
  replaced: boolean;
};
//#endregion
export { type CiOptions, type CiResult, type CreatorLine, type Credentials, type MiniprogramCi, type PackageSizeReport, type ProposeSubpackagesResult, SUBPACKAGE_BUNDLE_CONFIG, SUBPACKAGE_CONFIG_ID, type SizeHint, type SubpackageCandidate, type SubpackageResult, type SubpackageSize, WECHAT_LIMITS, checkPackageSize, configureSubpackages, detectCreatorLine, installPlugin, pluginInfo, preview, proposeSubpackages, readGameJson, removeSubpackages, resolveCredentials, setProjectAppid, sizeHints, upload };
//# sourceMappingURL=index.d.ts.map