import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
//#region src/hints.ts
/** Artifact path fragments → Cocos includeModules ids (same mapping kurenai uses). */
const ARTIFACT_MODULES = [
	{
		pattern: /bullet/i,
		modules: ["physics-ammo"]
	},
	{
		pattern: /cannon/i,
		modules: ["physics-cannon"]
	},
	{
		pattern: /physx/i,
		modules: ["physics-physx"]
	},
	{
		pattern: /box2d/i,
		modules: ["physics-2d-box2d", "physics-2d-box2d-wasm"]
	},
	{
		pattern: /spine/i,
		modules: ["spine-3.8", "spine-4.2"]
	},
	{
		pattern: /dragonbones|dragon-bones|dragonBones/i,
		modules: ["dragon-bones"]
	}
];
/**
* Turn a size report into actionable hints: engine artifacts in the main package, and
* top-level `assets/<folder>/` trees that can move into WeChat subpackages.
*/
function sizeHints(report) {
	const hints = [];
	const seenModules = /* @__PURE__ */ new Set();
	for (const file of report.main.largest) for (const { pattern, modules } of ARTIFACT_MODULES) {
		if (!pattern.test(file.path)) continue;
		for (const module of modules) {
			if (seenModules.has(module)) continue;
			seenModules.add(module);
			hints.push({
				kind: "engine-module",
				module,
				evidence: file.path,
				bytes: file.bytes
			});
		}
	}
	const folderBytes = /* @__PURE__ */ new Map();
	for (const file of report.main.largest) {
		const match = /^assets\/([^/]+)\//.exec(file.path);
		if (!match) continue;
		const folder = `assets/${match[1]}`;
		folderBytes.set(folder, (folderBytes.get(folder) ?? 0) + file.bytes);
	}
	for (const [folder, bytes] of [...folderBytes.entries()].sort((a, b) => b[1] - a[1])) hints.push({
		kind: "asset-folder",
		folder,
		bytes
	});
	return hints;
}
//#endregion
//#region src/size.ts
const MiB = 1048576;
/** WeChat mini-game code package limits (developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage). */
const WECHAT_LIMITS = {
	mainBytes: 4 * MiB,
	independentSubpackageBytes: 4 * MiB,
	totalBytes: 20 * MiB,
	/** Games with virtual payment enabled get 30 MB in total. */
	totalBytesWithVirtualPayment: 30 * MiB
};
/** Files the WeChat tooling never ships. */
const NOT_SHIPPED = /* @__PURE__ */ new Set(["project.config.json", "project.private.config.json"]);
function readGameJson(buildDir) {
	const file = join(buildDir, "game.json");
	if (!existsSync(file)) throw new Error(`Not a WeChat mini-game build (no game.json): ${buildDir}`);
	return JSON.parse(readFileSync(file, "utf8"));
}
function listFiles(dir, out = [], root = dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) listFiles(full, out, root);
		else if (entry.isFile()) out.push({
			path: relative(root, full).split(sep).join("/"),
			bytes: statSync(full).size
		});
	}
	return out;
}
function normalizeRoot(root) {
	const trimmed = root.replace(/^\.?\//, "");
	return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}
const mb = (bytes) => `${(bytes / MiB).toFixed(2)} MB`;
/**
* Measure a wechatgame build directory the way WeChat applies its limits: every file under
* a `game.json` subpackage root counts towards that subpackage, everything else is the main package.
*/
function checkPackageSize(buildDir, options = {}) {
	const game = readGameJson(buildDir);
	const subpackages = (game.subpackages ?? game.subPackages ?? []).filter((entry) => typeof entry.root === "string" && entry.root.length > 0).map((entry) => ({
		name: entry.name ?? entry.root,
		root: normalizeRoot(entry.root),
		independent: entry.independent === true,
		bytes: 0,
		files: 0
	}));
	const mainFiles = [];
	for (const file of listFiles(buildDir)) {
		if (NOT_SHIPPED.has(file.path)) continue;
		const owner = subpackages.find((pkg) => file.path.startsWith(pkg.root));
		if (owner) {
			owner.bytes += file.bytes;
			owner.files += 1;
		} else mainFiles.push(file);
	}
	const limits = {
		mainBytes: WECHAT_LIMITS.mainBytes,
		independentSubpackageBytes: WECHAT_LIMITS.independentSubpackageBytes,
		totalBytes: options.virtualPayment ? WECHAT_LIMITS.totalBytesWithVirtualPayment : WECHAT_LIMITS.totalBytes
	};
	const mainBytes = mainFiles.reduce((sum, file) => sum + file.bytes, 0);
	const totalBytes = mainBytes + subpackages.reduce((sum, pkg) => sum + pkg.bytes, 0);
	const violations = [];
	if (mainBytes > limits.mainBytes) violations.push(`main package ${mb(mainBytes)} exceeds ${mb(limits.mainBytes)}`);
	for (const pkg of subpackages) if (pkg.independent && pkg.bytes > limits.independentSubpackageBytes) violations.push(`independent subpackage ${pkg.name} ${mb(pkg.bytes)} exceeds ${mb(limits.independentSubpackageBytes)}`);
	if (totalBytes > limits.totalBytes) violations.push(`total ${mb(totalBytes)} exceeds ${mb(limits.totalBytes)}`);
	const largest = [...mainFiles].sort((a, b) => b.bytes - a.bytes).slice(0, options.largest ?? 10);
	const report = {
		ok: violations.length === 0,
		buildDir,
		limits,
		main: {
			bytes: mainBytes,
			files: mainFiles.length,
			largest
		},
		subpackages,
		totalBytes,
		violations,
		hints: []
	};
	report.hints = sizeHints(report);
	return report;
}
//#endregion
//#region src/subpackage.ts
/** Bundle config preset this package owns in the project's builder settings. */
const SUBPACKAGE_CONFIG_ID = "kurenai_wechat_subpackage";
/**
* WeChat builds the bundle as a mini-game subpackage; every other platform keeps the
* default merge_dep bundle. `overwrite` mode means "use overwriteSettings[platform], else merge_dep".
*/
const SUBPACKAGE_BUNDLE_CONFIG = {
	displayName: "WeChat subpackage (kurenai-wechat)",
	configs: {
		native: { preferredOptions: {
			isRemote: false,
			compressionType: "merge_dep"
		} },
		web: {
			preferredOptions: {
				isRemote: false,
				compressionType: "merge_dep"
			},
			fallbackOptions: { compressionType: "merge_dep" }
		},
		miniGame: {
			configMode: "overwrite",
			overwriteSettings: { wechatgame: {
				isRemote: false,
				compressionType: "subpackage"
			} }
		}
	}
};
function readJson(file) {
	return JSON.parse(readFileSync(file, "utf8"));
}
function writeJson(file, value) {
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function asObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function detectCreatorLine(project) {
	const pkgFile = join(project, "package.json");
	if (!existsSync(pkgFile)) throw new Error(`Not a Cocos Creator project (no package.json): ${project}`);
	const version = String(asObject(readJson(pkgFile).creator).version ?? "");
	if (version.startsWith("3.")) return "3.8";
	if (version.startsWith("4.")) return "4";
	throw new Error(`Unsupported Creator version "${version}" in ${pkgFile} (expected 3.8.x or 4.x)`);
}
/** Creator 4 keeps project builder settings in settings/cocos.config.json; 3.8 in settings/v2/packages/builder.json. */
function builderSettings(project, creator) {
	if (creator === "4") {
		const file = join(project, "settings", "cocos.config.json");
		const root = existsSync(file) ? readJson(file) : {};
		const builder = asObject(root.builder);
		root.builder = builder;
		return {
			file,
			root,
			builder
		};
	}
	const file = join(project, "settings", "v2", "packages", "builder.json");
	const root = existsSync(file) ? readJson(file) : { __version__: "1.3.9" };
	return {
		file,
		root,
		builder: root
	};
}
function bundleNameFor(folder) {
	const name = basename(folder).replace(/[^A-Za-z0-9_-]/g, "_");
	if (!name) throw new Error(`Cannot derive a bundle name from ${folder}`);
	return name;
}
function resolveFolder(project, folder) {
	const absolute = isAbsolute(folder) ? folder : resolve(project, folder);
	const rel = relative(join(project, "assets"), absolute);
	if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Subpackage folder must be inside ${join(project, "assets")}: ${folder}`);
	if (!existsSync(absolute) || !statSync(absolute).isDirectory()) throw new Error(`Subpackage folder does not exist: ${absolute}`);
	return absolute;
}
/**
* Turn asset folders into Asset Bundles that WeChat builds as subpackages
* (output under `subpackages/<bundleName>/`, listed in game.json). Idempotent.
*/
function configureSubpackages(projectDir, folders, options = {}) {
	if (!folders.length) throw new Error("Pass at least one asset folder to turn into a subpackage");
	const project = resolve(projectDir);
	const creator = detectCreatorLine(project);
	const settings = builderSettings(project, creator);
	const bundleConfig = asObject(settings.builder.bundleConfig);
	const custom = asObject(bundleConfig.custom);
	custom[SUBPACKAGE_CONFIG_ID] = SUBPACKAGE_BUNDLE_CONFIG;
	bundleConfig.custom = custom;
	settings.builder.bundleConfig = bundleConfig;
	const names = /* @__PURE__ */ new Set();
	const bundles = folders.map((folder) => {
		const absolute = resolveFolder(project, folder);
		const metaFile = `${absolute}.meta`;
		const metaCreated = !existsSync(metaFile);
		const meta = metaCreated ? {
			ver: "1.2.0",
			importer: "directory",
			imported: true,
			uuid: randomUUID(),
			files: [],
			subMetas: {},
			userData: {}
		} : readJson(metaFile);
		const userData = asObject(meta.userData);
		const bundleName = typeof userData.bundleName === "string" && userData.bundleName ? userData.bundleName : bundleNameFor(absolute);
		if (names.has(bundleName)) throw new Error(`Two folders map to the same bundle name: ${bundleName}`);
		names.add(bundleName);
		meta.userData = {
			...userData,
			isBundle: true,
			bundleConfigID: SUBPACKAGE_CONFIG_ID,
			bundleName,
			priority: typeof userData.priority === "number" ? userData.priority : options.priority ?? 1
		};
		writeJson(metaFile, meta);
		return {
			folder: relative(project, absolute).split(sep).join("/"),
			bundleName,
			metaCreated
		};
	});
	writeJson(settings.file, settings.root);
	return {
		project,
		creator,
		settingsFile: settings.file,
		bundles
	};
}
/** Undo configureSubpackages for the given folders (the bundle preset stays in settings). */
function removeSubpackages(projectDir, folders) {
	const project = resolve(projectDir);
	const changed = [];
	for (const folder of folders) {
		const metaFile = `${resolveFolder(project, folder)}.meta`;
		if (!existsSync(metaFile)) continue;
		const meta = readJson(metaFile);
		const userData = asObject(meta.userData);
		if (userData.bundleConfigID !== "kurenai_wechat_subpackage") continue;
		const { isBundle: _isBundle, bundleConfigID: _id, bundleName: _name, priority: _priority, ...rest } = userData;
		meta.userData = rest;
		writeJson(metaFile, meta);
		changed.push(relative(project, metaFile).split(sep).join("/"));
	}
	return changed;
}
//#endregion
//#region src/propose-subpackages.ts
function dirStats(dir) {
	let bytes = 0;
	let files = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.endsWith(".meta")) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			const nested = dirStats(full);
			bytes += nested.bytes;
			files += nested.files;
		} else if (entry.isFile()) {
			bytes += statSync(full).size;
			files += 1;
		}
	}
	return {
		bytes,
		files
	};
}
function isBundleMeta(metaFile) {
	if (!existsSync(metaFile)) return false;
	try {
		return JSON.parse(readFileSync(metaFile, "utf8")).userData?.isBundle === true;
	} catch {
		return false;
	}
}
/**
* Rank top-level `assets/*` folders by on-disk size as WeChat subpackage candidates.
* Engine/cocos-js weight is out of scope — that is kurenai's proposeEngineCuts.
*/
function proposeSubpackages(projectDir, options = {}) {
	const project = projectDir;
	const assets = join(project, "assets");
	if (!existsSync(assets)) throw new Error(`No assets/ directory: ${assets}`);
	const limit = options.limit ?? 20;
	const minBytes = options.minBytes ?? 32768;
	const candidates = [];
	for (const entry of readdirSync(assets, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		const absolute = join(assets, entry.name);
		const { bytes, files } = dirStats(absolute);
		if (bytes < minBytes) continue;
		const folder = relative(project, absolute).split(sep).join("/");
		candidates.push({
			folder,
			bytes,
			files,
			alreadyBundle: isBundleMeta(`${absolute}.meta`)
		});
	}
	candidates.sort((a, b) => b.bytes - a.bytes);
	const trimmed = candidates.slice(0, limit);
	return {
		project,
		candidates: trimmed,
		suggested: trimmed.filter((c) => !c.alreadyBundle).map((c) => c.folder)
	};
}
//#endregion
//#region src/ci.ts
const PLACEHOLDER_APPIDS = /* @__PURE__ */ new Set([
	"",
	"touristappid",
	"wx0000000000000000"
]);
function projectConfigFile(buildDir) {
	return join(buildDir, "project.config.json");
}
function readProjectAppid(buildDir) {
	const file = projectConfigFile(buildDir);
	if (!existsSync(file)) return void 0;
	const appid = JSON.parse(readFileSync(file, "utf8")).appid;
	return typeof appid === "string" && !PLACEHOLDER_APPIDS.has(appid) ? appid : void 0;
}
/** Options first, then WECHAT_MINIGAME_* env, then the appid already in project.config.json. */
function resolveCredentials(buildDir, options = {}) {
	const env = options.env ?? process.env;
	const appid = options.appid || env.WECHAT_MINIGAME_APPID || readProjectAppid(buildDir);
	if (!appid) throw new Error("Missing WeChat appid: pass --appid, set WECHAT_MINIGAME_APPID, or put it in project.config.json");
	const privateKeyPath = options.privateKeyPath || env.WECHAT_MINIGAME_PRIVATE_KEY_PATH;
	const privateKey = env.WECHAT_MINIGAME_PRIVATE_KEY;
	if (privateKeyPath) {
		const keyPath = resolve(privateKeyPath);
		if (!existsSync(keyPath)) throw new Error(`WeChat upload key not found: ${keyPath}`);
		return {
			appid,
			privateKeyPath: keyPath
		};
	}
	if (privateKey) return {
		appid,
		privateKey
	};
	throw new Error("Missing WeChat code upload key: pass --private-key <file>, or set WECHAT_MINIGAME_PRIVATE_KEY_PATH (or WECHAT_MINIGAME_PRIVATE_KEY with the key content). Download it from the mini-game admin console (开发管理 → 开发设置 → 小程序代码上传) and add this machine's IP to the whitelist.");
}
/** Write the appid into project.config.json so the build also opens correctly in WeChat DevTools. */
function setProjectAppid(buildDir, appid) {
	const file = projectConfigFile(buildDir);
	const config = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { compileType: "game" };
	if (config.appid === appid) return;
	config.appid = appid;
	writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}
function loadCi(options) {
	if (options.ci) return options.ci;
	return createRequire(import.meta.url)("miniprogram-ci");
}
function prepare(buildDir, options) {
	const dir = resolve(buildDir);
	const size = checkPackageSize(dir, options.virtualPayment ? { virtualPayment: true } : {});
	if (!size.ok) throw Object.assign(/* @__PURE__ */ new Error(`WeChat package limits exceeded: ${size.violations.join("; ")}`), { size });
	const credentials = resolveCredentials(dir, options);
	setProjectAppid(dir, credentials.appid);
	const ci = loadCi(options);
	const common = {
		project: new ci.Project({
			appid: credentials.appid,
			type: "miniGame",
			projectPath: dir,
			...credentials.privateKeyPath ? { privateKeyPath: credentials.privateKeyPath } : { privateKey: credentials.privateKey },
			ignores: ["node_modules/**/*"]
		}),
		setting: {
			useProjectConfig: true,
			es6: false,
			es7: false,
			minify: false,
			minifyJS: false
		},
		onProgressUpdate: (task) => options.onProgress?.(typeof task === "string" ? task : JSON.stringify(task)),
		...options.robot ? { robot: options.robot } : {},
		...options.desc ? { desc: options.desc } : {}
	};
	return {
		dir,
		size,
		appid: credentials.appid,
		ci,
		common
	};
}
/** Upload a dev build and write the preview QR code (scan with WeChat to run it on a phone). */
async function preview(buildDir, options = {}) {
	const { dir, size, appid, ci, common } = prepare(buildDir, options);
	const qrcode = resolve(options.qrcodeOutput ?? join(dirname(dir), `${appid}-preview.jpg`));
	mkdirSync(dirname(qrcode), { recursive: true });
	const result = await ci.preview({
		...common,
		qrcodeFormat: "image",
		qrcodeOutputDest: qrcode
	});
	return {
		ok: true,
		action: "preview",
		appid,
		size,
		qrcode,
		...result.subPackageInfo ? { subPackageInfo: result.subPackageInfo } : {}
	};
}
/** Upload as a dev version; promote it to trial/release in the admin console. */
async function upload(buildDir, options) {
	if (!options.version) throw new Error("upload needs a version (e.g. --version 1.0.0)");
	const { size, appid, ci, common } = prepare(buildDir, options);
	const result = await ci.upload({
		...common,
		version: options.version
	});
	return {
		ok: true,
		action: "upload",
		appid,
		size,
		version: options.version,
		...result.subPackageInfo ? { subPackageInfo: result.subPackageInfo } : {}
	};
}
//#endregion
//#region src/plugin.ts
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The bundled Cocos 4 wechatgame builder plugin (Creator 3.8 ships its own). */
function pluginInfo() {
	const dir = join(packageRoot, "plugin", "wechat");
	const markerFile = join(dir, ".kurenai-pack.json");
	if (!existsSync(markerFile)) throw new Error(`Bundled wechat plugin missing: ${dir}`);
	return {
		...JSON.parse(readFileSync(markerFile, "utf8")),
		dir
	};
}
function packageVersion() {
	return JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")).version;
}
/**
* Install the plugin into a cocos-cli root as packages/platforms/wechat, where the builder
* discovers platform plugins. Refuses a cocos-cli whose engine version differs from the plugin's.
*/
function installPlugin(cocosCliRoot) {
	const root = resolve(cocosCliRoot);
	const { dir: pluginDir, ...plugin } = pluginInfo();
	const enginePkg = join(root, "packages", "engine", "package.json");
	if (!existsSync(enginePkg)) throw new Error(`Not a cocos-cli root (no packages/engine): ${root}`);
	const engineVersion = JSON.parse(readFileSync(enginePkg, "utf8")).version;
	if (engineVersion !== plugin.engineVersion) throw new Error(`wechat plugin is for engine ${plugin.engineVersion}, but ${root} has engine ${engineVersion}`);
	const dest = join(root, "packages", "platforms", "wechat");
	const replaced = existsSync(dest);
	rmSync(dest, {
		recursive: true,
		force: true
	});
	cpSync(pluginDir, dest, { recursive: true });
	const marker = {
		...plugin,
		source: `@kurenai-studio/wechat-minigame@${packageVersion()}`,
		installedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	writeFileSync(join(dest, ".kurenai-pack.json"), `${JSON.stringify(marker, null, 2)}\n`);
	return {
		dir: dest,
		engineVersion,
		replaced
	};
}
//#endregion
export { SUBPACKAGE_BUNDLE_CONFIG, SUBPACKAGE_CONFIG_ID, WECHAT_LIMITS, checkPackageSize, configureSubpackages, detectCreatorLine, installPlugin, pluginInfo, preview, proposeSubpackages, readGameJson, removeSubpackages, resolveCredentials, setProjectAppid, sizeHints, upload };

//# sourceMappingURL=index.js.map