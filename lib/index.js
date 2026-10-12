import { n as formatSelectionContext, r as isInspectorMessage, t as KURENAI_PROTOCOL_VERSION } from "./protocol-3dNTvjX9.js";
import { createRequire } from "node:module";
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, delimiter, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer, get } from "node:http";
import { get as get$1 } from "node:https";
import { pipeline } from "node:stream/promises";
import httpProxy from "http-proxy";
import { randomUUID } from "node:crypto";
import { inflateRawSync } from "node:zlib";
//#region src/cocos/paths.ts
/** Default engine version for the bundled cocos runtime. */
const KURENAI_COCOS_CORE_VERSION = "4.0.0-alpha.33";
/**
* @deprecated PinK path — maintainer pack source only. Runtime never resolves here.
*/
const LEGACY_PINK_COCOS_CLI_ROOT = join(homedir(), "Library", "Application Support", "cocos-default", "cocos-4.0.0-alpha.33");
/** Absolute path to the kurenai package root (repo or installed package). */
function packageRoot() {
	const fromLib = fileURLToPath(new URL("..", import.meta.url));
	const fromSrc = fileURLToPath(new URL("../..", import.meta.url));
	if (existsSync(join(fromLib, "package.json"))) return fromLib;
	if (existsSync(join(fromSrc, "package.json"))) return fromSrc;
	throw new Error("Cannot locate kurenai package root");
}
/** Trimmed cocos runtime source tree shipped inside the kurenai package. */
function bundledCocosCoreRoot() {
	return join(packageRoot(), "vendor", "cocos-core");
}
/**
* @deprecated Application Support cache — no longer the default.
*/
function managedCocosCoreRoot(version = KURENAI_COCOS_CORE_VERSION) {
	return join(homedir(), "Library", "Application Support", "kurenai", "cocos-core", version);
}
/** Default runtime = vendor/cocos-core source tree. */
const DEFAULT_COCOS_CLI_ROOT = bundledCocosCoreRoot();
/**
* Resolve the cocos runtime root used by project / assets / preview / build.
*
* Order:
* 1. explicit `configured`
* 2. `KURENAI_COCOS_CLI_ROOT` (tests / override)
* 3. bundled `vendor/cocos-core` inside the kurenai package
*/
function resolveCocosCliRoot(configured) {
	if (configured) return resolve(configured);
	if (process.env.KURENAI_COCOS_CLI_ROOT) return resolve(process.env.KURENAI_COCOS_CLI_ROOT);
	return bundledCocosCoreRoot();
}
function packageFile(relativePath) {
	const full = join(packageRoot(), relativePath);
	if (!existsSync(full)) throw new Error(`Kurenai package file is missing: ${relativePath}`);
	return full;
}
//#endregion
//#region src/cocos/addons.ts
/** Outside the kurenai package so addons survive kurenai upgrades; override with KURENAI_ADDONS_DIR. */
function addonsDir() {
	return process.env.KURENAI_ADDONS_DIR || join(homedir(), ".kurenai", "addons");
}
function addonSpec(addon) {
	return addon.specEnv && process.env[addon.specEnv] || addon.name;
}
function stateFile(dir) {
	return join(dir, ".kurenai-addons.json");
}
function readState(dir) {
	const file = stateFile(dir);
	return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
}
function resolveInstalled(dir, name) {
	try {
		return createRequire(join(dir, "package.json")).resolve(name);
	} catch {
		return;
	}
}
function npmInstall(dir, spec) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("npm", [
			"install",
			"--prefix",
			dir,
			"--omit=dev",
			"--no-audit",
			"--no-fund",
			spec
		], {
			cwd: dir,
			stdio: [
				"ignore",
				"ignore",
				"pipe"
			],
			env: {
				...process.env,
				npm_config_progress: "false"
			},
			shell: process.platform === "win32"
		});
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolvePromise();
			else reject(/* @__PURE__ */ new Error(`npm install ${spec} failed (code=${String(code)}): ${stderr.trim().slice(-2e3)}`));
		});
	});
}
/** Install the addon unless the same spec is already installed; returns its entry file. */
async function ensureAddon(addon) {
	const dir = addonsDir();
	const spec = addonSpec(addon);
	const current = resolveInstalled(dir, addon.name);
	if (current && readState(dir)[addon.name] === spec) return {
		entry: current,
		installed: false
	};
	mkdirSync(dir, { recursive: true });
	if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), `${JSON.stringify({
		name: "kurenai-addons",
		private: true
	}, null, 2)}\n`);
	await npmInstall(dir, spec);
	const entry = resolveInstalled(dir, addon.name);
	if (!entry) throw new Error(`npm installed ${spec} but ${addon.name} does not resolve from ${dir}`);
	writeFileSync(stateFile(dir), `${JSON.stringify({
		...readState(dir),
		[addon.name]: spec
	}, null, 2)}\n`);
	return {
		entry,
		installed: true
	};
}
async function loadAddon(addon) {
	const { entry } = await ensureAddon(addon);
	return await import(pathToFileURL(entry).href);
}
//#endregion
//#region src/cocos/packs.ts
let cachedManifest;
function loadManifest() {
	if (cachedManifest) return cachedManifest;
	const path = packageFile("docs/cocos-cli-split.manifest.json");
	cachedManifest = JSON.parse(readFileSync(path, "utf8"));
	return cachedManifest;
}
function probePathsForPack(manifest, id) {
	if (id === "core") return ["dist/core/launcher.js"];
	if (id === manifest.packs.build.id) return manifest.packs.build.probes;
	const platform = manifest.packs.platform.packs.find((pack) => pack.id === id);
	if (platform) return [join(platform.dir, "package.json")];
	const native = [...manifest.packs.native.shared, ...manifest.packs.native.targets].find((pack) => pack.id === id);
	if (native) return native.paths;
	const tool = manifest.packs.platformTools.packs.find((pack) => pack.id === id);
	if (tool) return tool.paths;
	throw new Error(`Unknown cocos pack id: ${id}`);
}
function listKnownPackIds(root) {
	const manifest = loadManifest();
	return [
		"core",
		manifest.packs.build.id,
		...manifest.packs.platform.packs.map((pack) => pack.id),
		...manifest.packs.native.shared.map((pack) => pack.id),
		...manifest.packs.native.targets.map((pack) => pack.id),
		...manifest.packs.platformTools.packs.map((pack) => pack.id)
	];
}
/**
* Map a cocos/kurenai build platform to the packs that must be present.
* Every build needs core + the core build pack; mini-game / native add their own packs.
*/
function packsForPlatform(platform) {
	const build = loadManifest().packs.build.id;
	const packs = platformPacks(platform.trim().toLowerCase());
	return packs.includes(build) ? packs : [
		"core",
		build,
		...packs.filter((id) => id !== "core")
	];
}
function platformPacks(normalized) {
	const manifest = loadManifest();
	if (normalized === "web-desktop" || normalized === "web-mobile" || normalized === "web") return manifest.kurenaiHooks?.publishWeb ?? ["core"];
	const byHint = manifest.packs.platform.packs.find((pack) => pack.builderIdHint?.toLowerCase() === normalized || pack.id === `platform:${normalized}` || pack.dir.endsWith(`/${normalized}`));
	if (byHint) return ["core", byHint.id];
	if (normalized === "wechatgame" || normalized === "wechat") return manifest.kurenaiHooks?.publishWechat ?? ["core", "platform:wechat"];
	if (normalized === "bytedance-mini-game" || normalized === "bytedance") return ["core", "platform:bytedance"];
	if (normalized === "alipay-mini-game" || normalized === "alipay") return ["core", "platform:alipay"];
	if (normalized === "fb-instant-games" || normalized === "meta") return ["core", "platform:meta"];
	if (normalized === "android" || normalized === "google-play" || normalized === "huawei-agc") return manifest.kurenaiHooks?.publishAndroid ?? [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:android"
	];
	if (normalized === "ios") return [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:ios"
	];
	if (normalized === "mac" || normalized === "osx") return [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:mac"
	];
	if (normalized === "windows" || normalized === "win64") return [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:win64"
	];
	if (normalized === "ohos" || normalized === "harmonyos-next" || normalized === "openharmony") return [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:ohos"
	];
	if (normalized === "linux") return [
		"core",
		"native:engine-src",
		"native:tool-cmake",
		"native:linux"
	];
	return ["core"];
}
function inspectPack(id, configuredRoot) {
	const root = resolveCocosCliRoot(configuredRoot);
	const paths = probePathsForPack(loadManifest(), id);
	const missingPaths = paths.filter((relative) => !existsSync(join(root, relative)));
	return {
		id,
		present: missingPaths.length === 0,
		paths,
		missingPaths
	};
}
function packsStatus(configuredRoot) {
	const root = resolveCocosCliRoot(configuredRoot);
	const manifest = loadManifest();
	const packs = listKnownPackIds().map((id) => inspectPack(id, root));
	const hasLauncher = existsSync(join(root, "dist/core/launcher.js"));
	const hasNative = existsSync(join(root, "packages/engine/native"));
	const platformPacksPresent = manifest.packs.platform.packs.map((pack) => pack.id).filter((id) => inspectPack(id, root).present);
	return {
		root,
		layout: !existsSync(root) ? "missing" : hasLauncher ? "core-or-full" : "unknown",
		packs,
		hasNative,
		platformPacksPresent
	};
}
/** Platform packs that come from an npm package (plugin + publishing tools) instead of a tgz. */
function packAddon(id) {
	return loadManifest().packs.platform.packs.find((pack) => pack.id === id)?.npm;
}
/** The npm addon behind a build platform's pack, e.g. wechatgame → @kurenai-studio/wechat-minigame. */
function platformAddon(platform) {
	const id = packsForPlatform(platform).find((pack) => pack.startsWith("platform:"));
	return id ? packAddon(id) : void 0;
}
function packDownloadUrl(packId, baseUrl, version) {
	return `${baseUrl.replace(/\/$/, "")}/${version}/${packId.replaceAll(":", "/")}.tgz`;
}
function resolvePackBaseUrl(options) {
	return options.baseUrl || process.env.KURENAI_COCOS_PACK_BASE_URL || process.env.KURENAI_DEFAULT_COCOS_PACK_BASE_URL || void 0;
}
function openDownload(url, redirectsLeft = 5) {
	return new Promise((resolvePromise, reject) => {
		(url.startsWith("https:") ? get$1 : get)(url, (response) => {
			const status = response.statusCode ?? 0;
			const location = response.headers.location;
			if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
				response.resume();
				resolvePromise(openDownload(new URL(location, url).toString(), redirectsLeft - 1));
				return;
			}
			if (status !== 200) {
				response.resume();
				reject(/* @__PURE__ */ new Error(`Failed to download pack (${status}): ${url}`));
				return;
			}
			resolvePromise(response);
		}).on("error", reject);
	});
}
async function downloadToFile(url, dest) {
	const response = await openDownload(url);
	mkdirSync(dirname(dest), { recursive: true });
	await pipeline(response, createWriteStream(dest));
}
function runTarExtract(archive, dest) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("tar", [
			"-xzf",
			archive,
			"-C",
			dest
		], { stdio: [
			"ignore",
			"ignore",
			"pipe"
		] });
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolvePromise();
			else reject(/* @__PURE__ */ new Error(`tar extract failed (code=${String(code)}): ${stderr.trim()}`));
		});
	});
}
async function installPack(root, packId, options) {
	if (packId === "core") throw new Error("core is the vendor/cocos-core source tree inside kurenai — it is not downloaded as a pack");
	const url = packDownloadUrl(packId, options.baseUrl, options.version);
	const tmp = await mkdtemp(join(tmpdir(), "kurenai-pack-"));
	const archive = join(tmp, "pack.tgz");
	try {
		await downloadToFile(url, archive);
		mkdirSync(root, { recursive: true });
		await runTarExtract(archive, root);
	} finally {
		await rm(tmp, {
			recursive: true,
			force: true
		});
	}
	const after = inspectPack(packId, root);
	if (!after.present) throw new Error(`Pack ${packId} downloaded from ${url} but markers still missing: ${after.missingPaths.join(", ")}`);
}
function runNpmInstall(dir) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("npm", [
			"install",
			"--omit=dev",
			"--no-audit",
			"--no-fund",
			"--ignore-scripts"
		], {
			cwd: dir,
			stdio: [
				"ignore",
				"ignore",
				"pipe"
			],
			env: {
				...process.env,
				npm_config_progress: "false"
			},
			shell: process.platform === "win32"
		});
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolvePromise();
			else reject(/* @__PURE__ */ new Error(`npm install failed in ${dir} (code=${String(code)}): ${stderr.trim()}`));
		});
	});
}
function coreDepsInstalled(root) {
	return existsSync(join(root, "node_modules/@babel/core")) && existsSync(join(root, "node_modules/sharp/package.json")) && existsSync(join(root, "node_modules/jimp/package.json"));
}
/**
* vendor/cocos-core ships without full node_modules; install on first use. Engine-local
* node_modules are never installed (publish gets what it needs from the `build` pack).
*/
async function ensureCoreDependencies(root) {
	if (coreDepsInstalled(root)) return;
	if (!existsSync(join(root, "package.json"))) return;
	await runNpmInstall(root);
}
function coreVersion(options) {
	return options.version || process.env.KURENAI_COCOS_CORE_VERSION || loadManifest().measuredAgainst?.engineVersion || "4.0.0-alpha.33";
}
/**
* Ensure required packs under the kurenai runtime root (`vendor/cocos-core`).
* Core is the in-tree source; optional platform packs may still fetch from a CDN.
*/
async function ensurePacks(packIds, options = {}) {
	const root = resolveCocosCliRoot(options.cocosCliRoot);
	const required = [...new Set(packIds)];
	if (required.length === 0) return {
		root,
		required,
		alreadyPresent: [],
		installed: [],
		missing: []
	};
	const alreadyPresent = [];
	const missing = [];
	for (const id of required) if (inspectPack(id, root).present) alreadyPresent.push(id);
	else missing.push(id);
	const installed = [];
	const version = coreVersion(options);
	const wantRemote = options.fetch !== false;
	const baseUrl = resolvePackBaseUrl(options);
	for (const id of [...missing]) {
		if (id === "core") continue;
		const addon = packAddon(id);
		if (wantRemote && addon) {
			(await loadAddon(addon)).installPlugin(root);
			installed.push(id);
		} else if (wantRemote && baseUrl) {
			await installPack(root, id, {
				baseUrl,
				version
			});
			installed.push(id);
		}
	}
	const stillMissing = required.filter((id) => !inspectPack(id, root).present);
	if (stillMissing.length) {
		const hint = stillMissing.includes("core") ? `Core must exist at ${bundledCocosCoreRoot()} (run: npm run vendor:cocos).` : stillMissing.some((id) => packAddon(id)) ? `Run with fetch enabled so kurenai can npm-install the platform package.` : `Set KURENAI_COCOS_PACK_BASE_URL for optional platform/native packs.`;
		throw new Error(`Missing kurenai packs: ${stillMissing.join(", ")} (under ${root}).\n${hint}`);
	}
	if (required.includes("core")) await ensureCoreDependencies(root);
	return {
		root,
		required,
		alreadyPresent,
		installed,
		missing: stillMissing
	};
}
/** Convenience for preview / web publish. */
async function ensureCorePack(options = {}) {
	return ensurePacks(["core"], options);
}
//#endregion
//#region src/preview/bridge.ts
var PreviewBridge = class {
	config;
	server;
	inspectorScript = "";
	constructor(config) {
		this.config = config;
	}
	get url() {
		return `http://${this.config.host ?? "127.0.0.1"}:${this.config.port}/`;
	}
	async start() {
		if (this.server) return this.url;
		const scriptPath = this.config.inspectorScriptPath ?? fileURLToPath(new URL("./inspector.js", import.meta.url));
		this.inspectorScript = await readFile(scriptPath, "utf8");
		const proxy = httpProxy.createProxyServer({
			target: this.config.upstreamUrl,
			ws: true,
			changeOrigin: false
		});
		proxy.on("error", (_error, _request, response) => {
			if (response && "writeHead" in response && !response.headersSent) {
				response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
				response.end("Kurenai preview upstream is unavailable");
			}
		});
		const server = createServer((request, response) => {
			this.handleHttp(proxy, request, response);
		});
		server.on("upgrade", (request, socket, head) => {
			proxy.ws(request, socket, head);
		});
		await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.listen(this.config.port, this.config.host ?? "127.0.0.1", () => {
				server.off("error", reject);
				resolve();
			});
		});
		this.server = server;
		return this.url;
	}
	async stop() {
		const server = this.server;
		this.server = void 0;
		if (!server) return;
		await new Promise((resolve) => server.close(() => resolve()));
	}
	async handleHttp(proxy, request, response) {
		const url = new URL(request.url ?? "/", this.url);
		if (url.pathname === "/__kurenai/inspector.js") {
			response.writeHead(200, {
				"content-type": "text/javascript; charset=utf-8",
				"cache-control": "no-store"
			});
			response.end(this.inspectorScript);
			return;
		}
		if (request.method === "GET" && url.pathname === "/") {
			try {
				const upstream = await fetch(new URL(`${url.pathname}${url.search}`, this.config.upstreamUrl));
				const html = injectInspector(routeServerUrlThroughBridge(await upstream.text()));
				response.writeHead(upstream.status, {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "no-store"
				});
				response.end(html);
			} catch (error) {
				response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
				response.end(`Kurenai preview upstream failed: ${error instanceof Error ? error.message : String(error)}`);
			}
			return;
		}
		proxy.web(request, response);
	}
};
function routeServerUrlThroughBridge(html) {
	return html.replace(/(window\.WebEnv\s*=\s*\{\s*serverURL:\s*)(['"])[^'"]*\2/u, "$1location.origin");
}
function injectInspector(html) {
	const tag = "<script src=\"/__kurenai/inspector.js\"><\/script>";
	if (html.includes(tag)) return html;
	const bodyEnd = html.lastIndexOf("</body>");
	return bodyEnd >= 0 ? `${html.slice(0, bodyEnd)}${tag}${html.slice(bodyEnd)}` : `${html}${tag}`;
}
//#endregion
//#region src/preview/timeout.ts
/** Default wait for first cocos host readiness (engine internal imports can be slow). */
const DEFAULT_HOST_READY_TIMEOUT_MS = 6e5;
/**
* Resolve host readiness timeout.
* Priority: explicit ms → `--timeout` seconds → `KURENAI_HOST_READY_TIMEOUT_MS` → default 10m.
*/
function resolveHostReadyTimeoutMs(options = {}, env = process.env) {
	if (typeof options.readinessTimeoutMs === "number" && Number.isFinite(options.readinessTimeoutMs)) return Math.max(1e3, options.readinessTimeoutMs);
	if (typeof options.timeout === "string" && options.timeout.trim()) {
		const seconds = Number(options.timeout);
		if (Number.isFinite(seconds) && seconds > 0) return Math.max(1e3, Math.round(seconds * 1e3));
	}
	const fromEnv = Number(env.KURENAI_HOST_READY_TIMEOUT_MS);
	if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.max(1e3, Math.round(fromEnv));
	return DEFAULT_HOST_READY_TIMEOUT_MS;
}
//#endregion
//#region src/preview/controller.ts
const DEFAULT_PORT = 7460;
const DEFAULT_MAX_OLD_SPACE_SIZE_MB = 8192;
const MAX_LOG_LINES = 80;
const HOST_READY_LINE = /\[kurenai-host\] ready (http\S+)/u;
var PreviewController = class {
	config;
	child;
	bridge;
	upstreamUrl;
	hostPageUrl;
	state;
	spawnProcess;
	fetchImpl;
	killProcessTree;
	constructor(config, options = {}) {
		this.config = config;
		const port = config.port ?? DEFAULT_PORT;
		const bridgePort = config.bridgePort ?? port + 1;
		this.spawnProcess = options.spawnProcess ?? spawn;
		this.fetchImpl = options.fetchImpl ?? fetch;
		this.killProcessTree = options.killProcessTree ?? terminateProcessTree;
		this.state = {
			phase: "idle",
			url: `http://127.0.0.1:${bridgePort}/`,
			recentLogs: []
		};
		this.upstreamUrl = `http://127.0.0.1:${port}/`;
		if (config.project) this.state.project = resolve(config.project);
	}
	snapshot() {
		return {
			...this.state,
			recentLogs: [...this.state.recentLogs]
		};
	}
	async start(overrides = {}) {
		if (this.child && (this.state.phase === "starting" || this.state.phase === "ready")) return this.snapshot();
		const merged = {
			...this.config,
			...overrides
		};
		const project = requireDirectory("project", merged.project ?? process.env.KURENAI_PROJECT ?? process.cwd());
		const entry = resolve(merged.hostEntry ?? packageFile("bin/kurenai-cocos-host.mjs"));
		if (!existsSync(entry)) throw new Error(`Kurenai cocos host entry does not exist: ${entry}`);
		const cocosCliRoot = resolveCocosCliRoot(merged.cocosCliRoot);
		await ensureCorePack({ cocosCliRoot });
		const port = merged.port ?? DEFAULT_PORT;
		const bridgePort = merged.bridgePort ?? port + 1;
		this.upstreamUrl = `http://127.0.0.1:${port}/`;
		this.hostPageUrl = void 0;
		this.state = {
			phase: "starting",
			url: `http://127.0.0.1:${bridgePort}/`,
			project,
			startedAt: (/* @__PURE__ */ new Date()).toISOString(),
			recentLogs: []
		};
		const running = await this.findRunningHost(project);
		if (running) {
			this.adoptHostUrl(running.previewUrl);
			this.state.pid = running.pid;
			this.state.attached = true;
			try {
				await this.startBridge(merged, bridgePort);
			} catch (error) {
				this.state.phase = "failed";
				this.state.lastError = error instanceof Error ? error.message : String(error);
				throw error;
			}
			return this.snapshot();
		}
		const child = this.spawnProcess(process.execPath, [`--max-old-space-size=${merged.maxOldSpaceSizeMb ?? DEFAULT_MAX_OLD_SPACE_SIZE_MB}`, entry], {
			cwd: project,
			env: {
				...process.env,
				PROJECT: project,
				PORT: String(port),
				KURENAI_COCOS_CLI_ROOT: cocosCliRoot,
				...merged.scene ? { LAUNCH_SCENE: merged.scene } : {},
				...merged.watch === false ? { WATCH: "0" } : {},
				...merged.watchPoll ? { WATCH_POLL: "1" } : {}
			},
			stdio: "pipe",
			windowsHide: true
		});
		this.child = child;
		if (child.pid !== void 0) this.state.pid = child.pid;
		child.stdout.on("data", (chunk) => this.recordLog(String(chunk)));
		child.stderr.on("data", (chunk) => this.recordLog(String(chunk)));
		child.once("exit", (code, signal) => {
			if (this.child !== child) return;
			this.child = void 0;
			if (this.state.phase !== "stopped") {
				this.state.phase = code === 0 ? "stopped" : "failed";
				this.state.lastError = `cocos host exited (code=${String(code)}, signal=${String(signal)})`;
			}
		});
		const readinessTimeoutMs = resolveHostReadyTimeoutMs({ readinessTimeoutMs: merged.readinessTimeoutMs });
		try {
			await this.waitUntilReady(readinessTimeoutMs);
			await this.startBridge(merged, bridgePort);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.state.lastError = message;
			const stillRunning = Boolean(this.child && this.child.exitCode === null);
			const shouldKill = merged.killOnReadyTimeout === true;
			if (stillRunning && !shouldKill) {
				this.state.phase = "starting";
				this.state.lastError = `${message} (host left running; use kurenai host status, or raise readinessTimeoutMs / KURENAI_HOST_READY_TIMEOUT_MS)`;
				throw new Error(this.state.lastError);
			}
			this.state.phase = "failed";
			await this.stop();
			this.state.phase = "failed";
			throw error;
		}
		return this.snapshot();
	}
	async stop() {
		const bridge = this.bridge;
		this.bridge = void 0;
		await bridge?.stop();
		const child = this.child;
		this.state.phase = "stopped";
		this.child = void 0;
		if (!child || child.exitCode !== null) return this.snapshot();
		await this.killProcessTree(child);
		return this.snapshot();
	}
	async startBridge(config, bridgePort) {
		this.bridge = new PreviewBridge({
			upstreamUrl: this.upstreamUrl,
			port: bridgePort,
			...config.inspectorScriptPath ? { inspectorScriptPath: config.inspectorScriptPath } : {}
		});
		this.state.url = withPageOf(await this.bridge.start(), this.hostPageUrl);
		this.state.phase = "ready";
	}
	/** A ready host started elsewhere (e.g. by the kurenai CLI), advertised in temp/kurenai-host.json. */
	async findRunningHost(project) {
		let host;
		try {
			host = JSON.parse(await readFile(join(project, "temp", "kurenai-host.json"), "utf8"));
		} catch {
			return;
		}
		if (typeof host.pid !== "number" || typeof host.serverUrl !== "string") return void 0;
		if (typeof host.previewUrl !== "string" || !isAlive(host.pid)) return void 0;
		try {
			const response = await this.fetchImpl(new URL("/__kurenai/status", host.serverUrl), { signal: AbortSignal.timeout(1500) });
			return (response.ok ? await response.json() : void 0)?.ready === true ? {
				pid: host.pid,
				previewUrl: host.previewUrl
			} : void 0;
		} catch {
			return;
		}
	}
	recordLog(chunk) {
		const next = chunk.split(/\r?\n/u).map((line) => line.trimEnd()).filter(Boolean);
		for (const line of next) {
			const ready = HOST_READY_LINE.exec(line);
			if (ready?.[1]) this.adoptHostUrl(ready[1]);
		}
		this.state.recentLogs.push(...next);
		if (this.state.recentLogs.length > MAX_LOG_LINES) this.state.recentLogs.splice(0, this.state.recentLogs.length - MAX_LOG_LINES);
	}
	adoptHostUrl(value) {
		try {
			const url = new URL(value);
			this.upstreamUrl = `http://127.0.0.1:${url.port}/`;
			this.hostPageUrl = value;
		} catch {}
	}
	async waitUntilReady(timeoutMs) {
		const deadline = Date.now() + timeoutMs;
		let lastError = "cocos host did not answer";
		while (Date.now() < deadline) {
			if (!this.child) throw new Error([this.state.lastError ?? "cocos host exited before ready", this.state.recentLogs.at(-1)].filter(Boolean).join(": "));
			try {
				const response = await this.fetchImpl(new URL("/__kurenai/status", this.upstreamUrl), { signal: AbortSignal.timeout(1500) });
				if (response.ok) {
					const status = await response.json();
					if (status.ready === true) {
						if (typeof status.url === "string" && status.url) this.adoptHostUrl(status.url);
						return;
					}
					lastError = typeof status.lastError === "string" ? status.lastError : "preview settings not ready";
				} else lastError = `HTTP ${response.status}`;
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);
			}
			await new Promise((done) => setTimeout(done, 500));
		}
		throw new Error(`Kurenai cocos host was not ready after ${timeoutMs}ms: ${lastError}`);
	}
};
function withPageOf(bridgeUrl, hostPageUrl) {
	if (!hostPageUrl) return bridgeUrl;
	const page = new URL(hostPageUrl);
	return new URL(`${page.pathname}${page.search}`, bridgeUrl).toString();
}
async function terminateProcessTree(child) {
	if (child.exitCode !== null) return;
	if (process.platform === "win32" && child.pid !== void 0) {
		await new Promise((done) => {
			const killer = spawn("taskkill", [
				"/PID",
				String(child.pid),
				"/T",
				"/F"
			], {
				stdio: "ignore",
				windowsHide: true
			});
			killer.once("exit", () => done());
			killer.once("error", () => {
				child.kill("SIGKILL");
				done();
			});
		});
		return;
	}
	child.kill("SIGTERM");
	await Promise.race([new Promise((done) => child.once("exit", () => done())), new Promise((done) => setTimeout(() => {
		if (child.exitCode === null) child.kill("SIGKILL");
		done();
	}, 6e3))]);
}
function isAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}
function requireDirectory(label, value) {
	if (!value?.trim()) throw new Error(`${label} is required`);
	const path = resolve(value);
	if (!existsSync(path)) throw new Error(`${label} does not exist: ${path}`);
	return path;
}
//#endregion
//#region src/project/engine-modules.ts
const PHYSICS_3D = /\b(RigidBody|BoxCollider|SphereCollider|CapsuleCollider|CylinderCollider|ConeCollider|MeshCollider|PlaneCollider|TerrainCollider|SimplexCollider|CharacterController|BoxCharacterController|CapsuleCharacterController|PhysicsSystem|HingeConstraint|FixedConstraint|PointToPointConstraint|ConfigurableConstraint)\b/;
const PHYSICS_2D = /\b(RigidBody2D|PhysicsSystem2D|\w+Collider2D|\w+Joint2D)\b/;
const SPINE = /\bsp\.(Skeleton|SkeletonData)\b|\bcc\.sp\b|"cc\.sp\./;
/**
* Canonical ids for findMissingEngineModules (one per feature family).
* Preview always has the full engine; publish only ships includeModules.
*/
const MODULE_USAGE = {
	"physics-ammo": PHYSICS_3D,
	"physics-2d-box2d": PHYSICS_2D,
	"spine-3.8": SPINE,
	"dragon-bones": /\bdragonBones\b|"cc\.dragonBones/,
	terrain: /\bTerrain\b|"cc\.Terrain/,
	"tiled-map": /\bTiledMap\w*\b|"cc\.TiledMap/,
	video: /\bVideoPlayer\b|"cc\.VideoPlayer/,
	webview: /\bWebView\b|"cc\.WebView/,
	"particle-2d": /\bParticleSystem2D\b|"cc\.ParticleSystem2D/,
	"light-probe": /\bLightProbe\w*\b|"cc\.LightProbe/
};
/** Detectable modules for minimal-set compression (scripts + scene/prefab text). */
const DETECT_USAGE = {
	...MODULE_USAGE,
	"physics-cannon": PHYSICS_3D,
	"physics-physx": PHYSICS_3D,
	"physics-2d-box2d-wasm": PHYSICS_2D,
	"spine-4.2": SPINE,
	"2d": /\b(UITransform|Sprite|Label|Canvas|Widget|Layout|Button|ScrollView|EditBox|ProgressBar|Toggle|PageView|Slider|SafeArea|BlockInputEvents|PageViewIndicator)\b|"cc\.(UITransform|Sprite|Label|Canvas|Widget|Layout|Button)/,
	ui: /\b(Canvas|Widget|Layout|Button|ScrollView|EditBox|ProgressBar|Toggle|PageView|Slider|SafeArea)\b|"cc\.(Canvas|Widget|Layout|Button)/,
	graphics: /\bGraphics\b|"cc\.Graphics/,
	"rich-text": /\bRichText\b|"cc\.RichText/,
	mask: /\bMask\b|"cc\.Mask/,
	"ui-skew": /\bUISkew\b|"cc\.UISkew/,
	"affine-transform": /\baffineTransform\b|\bAffineTransform\b/,
	"intersection-2d": /\bIntersection2D\b|intersection2D/,
	"3d": /\b(MeshRenderer|SkinnedMeshRenderer|DirectionalLight|SpotLight|SphereLight|ModelRenderer|MeshCollider|Terrain|Skybox)\b|"cc\.(MeshRenderer|SkinnedMeshRenderer|DirectionalLight|SpotLight|SphereLight)/,
	particle: /\bParticleSystem\b(?!2D)|"cc\.ParticleSystem"/,
	primitive: /\bPrimitive\b|"cc\.Primitive/,
	animation: /\b(Animation|AnimationClip|AnimationState)\b|"cc\.Animation"/,
	"skeletal-animation": /\b(SkeletalAnimation|SkinnedMeshRenderer)\b|"cc\.SkeletalAnimation/,
	marionette: /\b(animation\.|AnimationGraph|Marionette)\b/,
	audio: /\b(AudioSource|AudioClip)\b|"cc\.AudioSource/,
	tween: /\btween\s*\(|\bTween\b/,
	websocket: /\bWebSocket\b/,
	"particle-2d": /\bParticleSystem2D\b|"cc\.ParticleSystem2D/,
	terrain: /\bTerrain\b|"cc\.Terrain/,
	"tiled-map": /\bTiledMap\w*\b|"cc\.TiledMap/,
	video: /\bVideoPlayer\b|"cc\.VideoPlayer/,
	webview: /\bWebView\b|"cc\.WebView/,
	"dragon-bones": /\bdragonBones\b|"cc\.dragonBones/,
	profiler: /\bProfiler\b|"cc\.Profiler/,
	"light-probe": /\bLightProbeGroup\b|"cc\.LightProbeGroup/
};
/** Feature → dependencies (includeModules ids). Options inherit their group's deps. */
const FEATURE_DEPS = {
	"skeletal-animation": ["animation"],
	"3d": ["meshopt"],
	"sorting-2d": ["2d"],
	"rich-text": ["2d"],
	mask: ["2d", "graphics"],
	graphics: ["2d"],
	"ui-skew": ["2d"],
	ui: ["2d"],
	particle: ["3d"],
	"physics-ammo": ["3d"],
	"physics-cannon": ["3d"],
	"physics-physx": ["3d"],
	"physics-builtin": ["3d"],
	"physics-2d-box2d": ["2d"],
	"physics-2d-box2d-wasm": ["2d"],
	"physics-2d-builtin": ["2d"],
	"intersection-2d": ["2d"],
	primitive: ["3d"],
	"occlusion-query": ["3d"],
	"geometry-renderer": ["3d"],
	"debug-renderer": ["3d"],
	"particle-2d": ["2d"],
	terrain: ["3d"],
	"light-probe": ["3d"],
	"tiled-map": ["2d"],
	"spine-3.8": ["2d"],
	"spine-4.2": ["2d"],
	"dragon-bones": ["2d"],
	marionette: ["animation"],
	"procedural-animation": ["animation"]
};
const OPTION_GROUPS = [
	[
		"physics-ammo",
		"physics-cannon",
		"physics-physx",
		"physics-builtin"
	],
	[
		"physics-2d-box2d",
		"physics-2d-box2d-wasm",
		"physics-2d-builtin",
		"physics-2d-box2d-jsb"
	],
	["spine-3.8", "spine-4.2"],
	["custom-pipeline", "legacy-pipeline"]
];
/** Always required for HTML5 / WeChat mini-game builds. */
const ALWAYS = ["base", "gfx-webgl"];
/** Scene/prefab __type__ values that every default scene carries — ignore for detection. */
const SCENE_NOISE = /^cc\.(Scene|SceneAsset|SceneGlobals|Node|Prefab|PrefabInfo|Color|Vec[234]|Quat|Rect|Size|Mat[34]|AmbientInfo|FogInfo|LightProbeInfo|OctreeInfo|ShadowsInfo|SkyboxInfo|SkinInfo|PostSettingsInfo|Camera)$/;
async function listFiles(dir, re) {
	const out = [];
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...await listFiles(path, re));
		else if (re.test(entry.name)) out.push(path);
	}
	return out;
}
function modulesOf(engine) {
	if (Array.isArray(engine?.includeModules) && engine.includeModules.length) return engine.includeModules;
	const key = engine?.globalConfigKey || Object.keys(engine?.configs ?? {})[0];
	const list = key ? engine.configs?.[key]?.includeModules : void 0;
	return Array.isArray(list) && list.length ? list : void 0;
}
function setModulesOf(engine, modules) {
	if (Array.isArray(engine?.includeModules)) {
		engine.includeModules = modules;
		return;
	}
	const key = engine?.globalConfigKey || Object.keys(engine?.configs ?? {})[0] || "defaultConfig";
	engine.globalConfigKey ??= key;
	engine.configs ??= {};
	engine.configs[key] ??= {};
	engine.configs[key].includeModules = modules;
}
function familySatisfied(module, included) {
	const family = OPTION_GROUPS.find((group) => group.includes(module));
	if (!family) return included.has(module);
	return family.some((id) => included.has(id));
}
function pickOption(group, included, detectedNeed) {
	if (!detectedNeed) return void 0;
	return group.find((id) => included.includes(id)) ?? group[0];
}
const ENGINE_CONFIG_FILES = [{
	file: "settings/cocos.config.json",
	engine: (json) => json?.engine,
	ensure: (json) => {
		json.engine ??= {};
		return json.engine;
	}
}, {
	file: "settings/v2/packages/engine.json",
	engine: (json) => json?.modules,
	ensure: (json) => {
		json.modules ??= {};
		return json.modules;
	}
}];
async function loadEngineConfig(projectPath) {
	for (const { file, engine } of ENGINE_CONFIG_FILES) try {
		const absolute = join(projectPath, file);
		const root = JSON.parse(await readFile(absolute, "utf8"));
		const eng = engine(root);
		const modules = modulesOf(eng);
		if (modules) return {
			file,
			absolute,
			root,
			engine: eng,
			modules: [...modules]
		};
	} catch {}
}
async function collectProjectText(projectPath) {
	const files = await listFiles(join(projectPath, "assets"), /\.(ts|js|scene|prefab)$/);
	const out = [];
	for (const file of files) out.push({
		file: relative(projectPath, file),
		text: await readFile(file, "utf8")
	});
	return out;
}
/** Strip scene-globals noise so default LightProbeInfo / SkyboxInfo do not force 3d modules. */
function scrubSceneNoise(text, file) {
	if (!/\.(scene|prefab)$/.test(file)) return text;
	return text.replace(/"__type__"\s*:\s*"([^"]+)"/g, (full, type) => SCENE_NOISE.test(type) ? `"__type__":"cc.Node"` : full);
}
function detectModules(corpus) {
	const hit = /* @__PURE__ */ new Map();
	for (const { file, text } of corpus) {
		const body = scrubSceneNoise(text, file);
		for (const [module, pattern] of Object.entries(DETECT_USAGE)) {
			if (hit.has(module)) continue;
			const match = pattern.exec(body);
			if (match) hit.set(module, `${file}:${match[0]}`);
		}
	}
	return hit;
}
function closeDependencies(seed) {
	const out = /* @__PURE__ */ new Set();
	const stack = [...seed];
	while (stack.length) {
		const module = stack.pop();
		if (out.has(module)) continue;
		out.add(module);
		for (const dep of FEATURE_DEPS[module] ?? []) if (!out.has(dep)) stack.push(dep);
	}
	return out;
}
/**
* Build the smallest includeModules list that covers detected usage.
* Never invents modules the project did not already have, except ALWAYS + deps of kept modules.
* Pipeline (custom/legacy) is preserved when already included — required for Creator 4 render.
*/
function computeMinimalModules(included, detected) {
	const includedSet = new Set(included);
	const wanted = new Set(ALWAYS);
	const detectedList = [];
	for (const [module, evidence] of detected) {
		detectedList.push({
			module,
			evidence
		});
		const group = OPTION_GROUPS.find((g) => g.includes(module));
		if (group) {
			const pick = pickOption(group, included, true);
			if (pick) wanted.add(pick);
			continue;
		}
		if (module in DETECT_USAGE || module in FEATURE_DEPS || ALWAYS.includes(module)) wanted.add(module);
	}
	for (const group of OPTION_GROUPS) {
		if (group[0] === "custom-pipeline" || group[0] === "legacy-pipeline") continue;
		const pick = pickOption(group, included, group.some((id) => detected.has(id)));
		if (pick) wanted.add(pick);
	}
	for (const pipe of ["custom-pipeline", "legacy-pipeline"]) if (includedSet.has(pipe)) wanted.add(pipe);
	if (wanted.has("ui") || wanted.has("graphics") || wanted.has("rich-text") || wanted.has("mask")) {
		wanted.add("2d");
		wanted.add("ui");
	}
	if (![...wanted].some((m) => m === "2d" || m === "3d")) {
		wanted.add("2d");
		wanted.add("ui");
	}
	const closed = closeDependencies(wanted);
	const minimalSet = /* @__PURE__ */ new Set();
	for (const module of closed) if (ALWAYS.includes(module) || includedSet.has(module) || FEATURE_DEPS[module]) {
		if (ALWAYS.includes(module) || includedSet.has(module)) minimalSet.add(module);
		else if ([...closed].some((m) => (FEATURE_DEPS[m] ?? []).includes(module) && includedSet.has(m))) {
			if (includedSet.has(module)) minimalSet.add(module);
		}
	}
	for (const module of closeDependencies(minimalSet)) if (ALWAYS.includes(module) || includedSet.has(module)) minimalSet.add(module);
	const minimal = [...ALWAYS.filter((m) => minimalSet.has(m) && !included.includes(m)), ...included.filter((m) => minimalSet.has(m))];
	const seen = /* @__PURE__ */ new Set();
	return {
		minimal: minimal.filter((m) => seen.has(m) ? false : (seen.add(m), true)),
		detectedList
	};
}
async function includedModules(projectPath) {
	const config = await loadEngineConfig(projectPath);
	if (!config) return void 0;
	return {
		file: config.file,
		modules: new Set(config.modules)
	};
}
async function findMissingEngineModules(projectPath) {
	const config = await includedModules(projectPath);
	if (!config) return {
		file: "",
		missing: []
	};
	const included = config.modules;
	const checks = Object.keys(MODULE_USAGE).filter((module) => !familySatisfied(module, included));
	const corpus = await collectProjectText(projectPath);
	const missing = [];
	for (const { file, text } of corpus) {
		if (!/\.(ts|js)$/.test(file)) continue;
		for (const module of checks) {
			if (missing.some((m) => m.module === module)) continue;
			const pattern = MODULE_USAGE[module];
			if (!pattern) continue;
			const match = pattern.exec(text);
			if (match) missing.push({
				module,
				file,
				match: match[0]
			});
		}
	}
	return {
		file: config.file,
		missing
	};
}
function modulesFromArtifacts(artifacts) {
	const patterns = [
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
	const out = /* @__PURE__ */ new Map();
	for (const artifact of artifacts) for (const { pattern, modules } of patterns) {
		if (!pattern.test(artifact.path)) continue;
		for (const module of modules) {
			const prev = out.get(module);
			const bytes = artifact.bytes;
			if (!prev || (bytes ?? 0) > (prev.bytes ?? 0)) {
				const hint = { evidence: artifact.path };
				if (bytes !== void 0) hint.bytes = bytes;
				out.set(module, hint);
			}
		}
	}
	return out;
}
/**
* Propose a minimal includeModules list from project usage (scripts + scenes/prefabs).
* Optional build artifacts only annotate cut reasons / ordering — they do not keep modules.
*/
async function proposeEngineCuts(projectPath, options = {}) {
	const config = await loadEngineConfig(projectPath);
	if (!config) return {
		file: "",
		included: [],
		minimal: [],
		cuts: [],
		keep: [],
		blocked: [],
		detected: []
	};
	const detected = detectModules(await collectProjectText(projectPath));
	const { minimal, detectedList } = computeMinimalModules(config.modules, detected);
	const minimalSet = new Set(minimal);
	const fromArtifacts = modulesFromArtifacts(options.artifacts ?? []);
	const cuts = [];
	for (const module of config.modules) {
		if (minimalSet.has(module)) continue;
		const art = fromArtifacts.get(module);
		const cut = {
			module,
			reason: art ? "artifact" : "minimal"
		};
		if (art?.evidence !== void 0) cut.evidence = art.evidence;
		if (art?.bytes !== void 0) cut.bytes = art.bytes;
		cuts.push(cut);
	}
	cuts.sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0) || a.module.localeCompare(b.module));
	return {
		file: config.file,
		included: config.modules,
		minimal,
		cuts,
		keep: minimal,
		blocked: [],
		detected: detectedList
	};
}
/** Write an exact includeModules list into every engine settings file that has one. */
async function applyEngineModules(projectPath, modules) {
	if (!modules.length) throw new Error("includeModules list must not be empty");
	const next = [...modules];
	let primary;
	const written = [];
	for (const entry of ENGINE_CONFIG_FILES) try {
		const absolute = join(projectPath, entry.file);
		const root = JSON.parse(await readFile(absolute, "utf8"));
		const eng = entry.ensure(root);
		const previous = modulesOf(eng);
		if (!previous) continue;
		if (!primary) primary = {
			file: entry.file,
			absolute,
			root,
			engine: eng,
			modules: [...previous]
		};
		setModulesOf(eng, next);
		await writeFile(absolute, `${JSON.stringify(root, null, 2)}\n`);
		written.push(entry.file);
	} catch {}
	if (!primary || !written.length) throw new Error(`No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`);
	return {
		file: written.join(", "),
		removed: primary.modules.filter((m) => !next.includes(m)),
		included: next
	};
}
/** Compute minimal set and write it. */
async function applyMinimalEngineModules(projectPath) {
	const proposal = await proposeEngineCuts(projectPath);
	if (!proposal.file) throw new Error(`No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`);
	return {
		...await applyEngineModules(projectPath, proposal.minimal),
		minimal: proposal.minimal
	};
}
/** Remove the given modules from includeModules. Idempotent. */
async function applyEngineCuts(projectPath, modules) {
	if (!modules.length) throw new Error("Pass at least one engine module to remove (or use applyMinimalEngineModules)");
	const config = await loadEngineConfig(projectPath);
	if (!config) throw new Error(`No engine includeModules found under ${projectPath} (expected settings/cocos.config.json or settings/v2/packages/engine.json)`);
	const remove = new Set(modules);
	const unknown = modules.filter((module) => !config.modules.includes(module));
	if (unknown.length) throw new Error(`Not in includeModules: ${unknown.join(", ")}`);
	return applyEngineModules(projectPath, config.modules.filter((module) => !remove.has(module)));
}
//#endregion
//#region src/project/control.ts
function publishLogTail(combined, verbose) {
	const text = combined.trim();
	if (!text) return void 0;
	if (verbose) return text;
	return text.split("\n").slice(-30).join("\n");
}
const IGNORED_WORKSPACE_ENTRIES = /* @__PURE__ */ new Set([
	".git",
	".DS_Store",
	".cursor",
	".vscode",
	".idea"
]);
var ProjectControl = class {
	config;
	server;
	previews = /* @__PURE__ */ new Map();
	projects = /* @__PURE__ */ new Map();
	selections = /* @__PURE__ */ new Map();
	runCommand;
	constructor(config) {
		this.config = config;
		this.runCommand = config.runCommand ?? runCommandCapture;
	}
	get url() {
		return `http://${this.config.controlHost ?? "127.0.0.1"}:${this.config.controlPort ?? 7459}`;
	}
	async startServer() {
		if (this.server) return this.url;
		const server = createServer((request, response) => {
			this.handle(request, response);
		});
		await new Promise((resolvePromise, reject) => {
			server.once("error", reject);
			server.listen(this.config.controlPort ?? 7459, this.config.controlHost ?? "127.0.0.1", () => {
				server.off("error", reject);
				resolvePromise();
			});
		});
		this.server = server;
		return this.url;
	}
	async stopServer() {
		const server = this.server;
		this.server = void 0;
		if (server) await new Promise((resolvePromise) => server.close(() => resolvePromise()));
		await Promise.all([...this.previews.values()].map(async (preview) => preview.stop()));
		this.previews.clear();
	}
	async inspect(projectPath) {
		const absolutePath = resolve(projectPath);
		try {
			const packageJson = JSON.parse(await readFile(join(absolutePath, "package.json"), "utf8"));
			if (typeof packageJson.creator?.version !== "string") return void 0;
			const project = {
				name: typeof packageJson.name === "string" && packageJson.name.trim() ? packageJson.name : basename(absolutePath),
				projectPath: absolutePath,
				creatorVersion: packageJson.creator.version,
				dimension: await detectDimension(absolutePath)
			};
			this.projects.set(normalizePath(absolutePath), project);
			return project;
		} catch (error) {
			if (isMissingFile(error)) return void 0;
			throw error;
		}
	}
	async initialize(projectPath, template) {
		const target = resolve(projectPath);
		await mkdir(target, { recursive: true });
		if (await this.inspect(target)) throw new Error("This directory is already a Cocos Creator project");
		const projectEntries = (await readdir(target)).filter((entry) => !IGNORED_WORKSPACE_ENTRIES.has(entry));
		if (projectEntries.length) throw new Error(`Cocos initialization requires an empty directory; found: ${projectEntries.join(", ")}`);
		const configuredRoot = template === "base-ai-3d" ? this.config.template3dRoot : this.config.templateRoot;
		if (configuredRoot) await copyDirectoryContents(resolve(configuredRoot), target);
		else {
			await copyDirectoryContents(packageFile(join("templates", template)), target);
			await copyDirectoryContents(packageFile(join("templates", "shared")), target);
		}
		await assignProjectIdentity(target);
		const project = await this.inspect(target);
		if (!project) throw new Error("The initialized template is not a Cocos Creator project");
		return project;
	}
	async state(projectPath) {
		const absolutePath = resolve(projectPath);
		const key = normalizePath(absolutePath);
		const project = await this.inspect(absolutePath);
		const preview = this.previews.get(key)?.snapshot();
		const selection = this.selections.get(key);
		return {
			projectPath: absolutePath,
			...project ? { project } : {},
			...preview ? { preview } : {},
			...selection ? { selection } : {}
		};
	}
	async startPreview(projectPath) {
		const project = await this.inspect(projectPath);
		if (!project) throw new Error("The directory is not a Cocos Creator project");
		return (await this.previewFor(project.projectPath)).start({ project: project.projectPath });
	}
	async stopPreview(projectPath) {
		return (await this.previewFor(resolve(projectPath))).stop();
	}
	async publish(projectPath, options = {}) {
		const absolutePath = resolve(projectPath);
		if (!await this.inspect(absolutePath)) throw new Error("The directory is not a Cocos Creator project");
		const cocosCliRoot = resolveCocosCliRoot(this.config.cocosCliRoot);
		const platform = options.platform ?? "web-desktop";
		const { file: engineConfig, missing } = await findMissingEngineModules(absolutePath);
		if (missing.length) return {
			ok: false,
			platform,
			error: `Scripts use engine modules this project does not build (preview has them all, the published game would not). Add them to "includeModules" in ${engineConfig}: ` + missing.map((m) => `${m.module} (${m.match} in ${m.file})`).join("; "),
			missingModules: missing
		};
		await ensurePacks(packsForPlatform(platform), { cocosCliRoot });
		const args = [
			packageFile("bin/kurenai-cocos-build.mjs"),
			"--project",
			absolutePath,
			"--platform",
			platform
		];
		const buildConfig = {};
		if (options.outDir) {
			const outDir = resolve(absolutePath, options.outDir);
			buildConfig.buildPath = dirname(outDir);
			buildConfig.outputName = basename(outDir);
		}
		if (options.release) {
			buildConfig.debug = false;
			buildConfig.sourceMaps = false;
		}
		let configDir;
		if (Object.keys(buildConfig).length) {
			configDir = await mkdtemp(join(tmpdir(), "kurenai-build-"));
			const configPath = join(configDir, "build-config.json");
			await writeFile(configPath, JSON.stringify(buildConfig));
			args.push("--build-config", configPath);
		}
		try {
			const tscBin = join(cocosCliRoot, "node_modules", ".bin");
			const { stdout, stderr, code } = await this.runCommand(process.execPath, args, absolutePath, {
				...process.env,
				KURENAI_COCOS_CLI_ROOT: cocosCliRoot,
				...existsSync(join(tscBin, "tsc")) ? { PATH: `${tscBin}${delimiter}${process.env.PATH ?? ""}` } : {}
			});
			const combined = `${stdout}\n${stderr}`.trim();
			const dest = /Build Dest: (.+)$/mu.exec(combined)?.[1]?.trim();
			if (code !== 0 || !dest) return {
				ok: false,
				platform,
				exitCode: code,
				error: combined.slice(-4e3) || "cocos build failed"
			};
			const outDir = dest.startsWith("project://") ? join(absolutePath, dest.slice(10)) : resolve(absolutePath, dest);
			const logTail = publishLogTail(combined, options.verbose);
			const result = {
				ok: true,
				outDir,
				platform,
				mode: options.release ? "release" : "debug",
				...logTail !== void 0 ? { logTail } : {}
			};
			return platform === "wechatgame" ? await this.afterWechatBuild(result, options.wechat ?? {}) : result;
		} finally {
			if (configDir) await rm(configDir, {
				recursive: true,
				force: true
			});
		}
	}
	async afterWechatBuild(result, options) {
		const addon = platformAddon("wechatgame");
		if (!addon) return result;
		const wechat = await (this.config.loadAddon ?? loadAddon)(addon);
		const size = wechat.checkPackageSize(result.outDir, options.virtualPayment ? { virtualPayment: true } : {});
		const engineHints = (size.hints ?? []).filter((h) => h.kind === "engine-module");
		const assetHints = (size.hints ?? []).filter((h) => h.kind === "asset-folder");
		const hintParts = [];
		if (!size.ok) {
			if (engineHints.length) hintParts.push(`Shrink the engine to on-demand modules (kurenai engine propose-cuts --from-build ${result.outDir}; kurenai engine apply-cuts --minimal): artifacts suggest ` + engineHints.slice(0, 4).map((h) => h.module).filter(Boolean).join(", "));
			if (assetHints.length) hintParts.push("Or move asset folders into subpackages (kurenai wechat propose-subpackages <project> then kurenai wechat subpackage <project> <folder>): " + assetHints.slice(0, 4).map((h) => h.folder).filter(Boolean).join(", "));
			if (!hintParts.length) hintParts.push("Over WeChat's package limits. Drop unused engine modules (kurenai engine propose-cuts) or configure subpackages (kurenai wechat propose-subpackages / subpackage), then publish again.");
		}
		const sized = {
			...result,
			wechatSize: size,
			...hintParts.length ? { hint: hintParts.join(" ") } : {}
		};
		if (!options.preview && !options.upload) return sized;
		const ciOptions = {
			...options.appid ? { appid: options.appid } : {},
			...options.privateKeyPath ? { privateKeyPath: options.privateKeyPath } : {},
			...options.desc ? { desc: options.desc } : {},
			...options.robot ? { robot: options.robot } : {},
			...options.virtualPayment ? { virtualPayment: true } : {}
		};
		try {
			const wechatResult = options.upload ? await wechat.upload(result.outDir, {
				...ciOptions,
				version: options.version ?? ""
			}) : await wechat.preview(result.outDir, {
				...ciOptions,
				...options.qrcodeOutput ? { qrcodeOutput: options.qrcodeOutput } : {}
			});
			return {
				...sized,
				wechat: wechatResult
			};
		} catch (error) {
			return {
				...sized,
				ok: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}
	/** Type-checks assets/ with the vendored TypeScript; preview itself only strips types. */
	async typecheck(projectPath) {
		const absolutePath = resolve(projectPath);
		const tsconfig = join(absolutePath, "temp", "tsconfig.cocos.json");
		if (!existsSync(tsconfig)) return {
			ok: false,
			error: "temp/tsconfig.cocos.json is missing; run `kurenai host start` once first"
		};
		const cocosCliRoot = resolveCocosCliRoot(this.config.cocosCliRoot);
		const tsc = join(cocosCliRoot, "node_modules", "typescript", "bin", "tsc");
		if (!existsSync(tsc)) return {
			ok: false,
			error: `TypeScript not found: ${tsc}`
		};
		const { stdout, stderr } = await this.runCommand(process.execPath, [
			tsc,
			"--noEmit",
			"--pretty",
			"false",
			"--skipLibCheck",
			"--project",
			tsconfig
		], absolutePath);
		const errors = `${stdout}\n${stderr}`.split("\n").map((line) => line.trim()).filter((line) => /^assets\/.+\(\d+,\d+\): error TS\d+|^error TS\d+/.test(line));
		return {
			ok: errors.length === 0,
			errors
		};
	}
	setSelection(projectPath, selection) {
		const key = normalizePath(projectPath);
		if (selection) this.selections.set(key, selection);
		else this.selections.delete(key);
	}
	getSelection(projectPath) {
		return this.selections.get(normalizePath(projectPath));
	}
	/** `preview` overrides the in-process preview, e.g. a host started by the CLI. */
	contextText(projectPath, preview) {
		const absolutePath = resolve(projectPath);
		const key = normalizePath(absolutePath);
		const project = this.projects.get(key) ?? inspectProjectSync(absolutePath);
		if (project) this.projects.set(key, project);
		preview ??= this.previews.get(key)?.snapshot();
		const selection = this.selections.get(key);
		const lines = [
			"[Kurenai current Cocos context]",
			`workspace: ${absolutePath}`,
			`projectStatus: ${project ? "ready" : "uninitialized"}`
		];
		if (project) lines.push(`project: ${project.name}`, `creatorVersion: ${project.creatorVersion}`, `dimension: ${project.dimension.toUpperCase()}`);
		else lines.push("availableTemplates: 2D (base-ai), 3D (base-ai-3d)");
		lines.push(`preview: ${preview?.phase ?? "not-started"}`, `previewUrl: ${preview?.url ?? "(none)"}`);
		if (selection) lines.push(`selectedNode: ${selection.name}`, `selectedPath: ${selection.path}`, `selectedRuntimeId: ${selection.id}`, `selectedComponents: ${selection.componentTypes.join(", ") || "(none)"}`);
		const authoringGuide = project ? readAuthoringGuide(absolutePath) : void 0;
		if (authoringGuide) lines.push("", "[Kurenai project authoring guide]", "These project-specific rules are mandatory for every Cocos edit in this session:", authoringGuide);
		return lines.join("\n");
	}
	async previewFor(projectPath) {
		const key = normalizePath(projectPath);
		const existing = this.previews.get(key);
		if (existing) return existing;
		const port = await findAvailablePortPair((this.config.port ?? 7460) + this.previews.size * 2);
		const preview = new PreviewController({
			...this.config,
			project: projectPath,
			port,
			bridgePort: port + 1
		});
		this.previews.set(key, preview);
		return preview;
	}
	async handle(request, response) {
		setCors(response);
		if (request.method === "OPTIONS") {
			response.writeHead(204);
			response.end();
			return;
		}
		try {
			const url = new URL(request.url ?? "/", this.url);
			if (request.method === "GET" && url.pathname === "/api/project/default") {
				json(response, 200, { projectPath: process.cwd() });
				return;
			}
			if (request.method === "GET" && url.pathname === "/api/project") {
				const projectPath = requireText(url.searchParams.get("projectPath"), "projectPath");
				json(response, 200, await this.state(projectPath));
				return;
			}
			if (request.method === "POST") {
				const body = await readJson(request);
				const projectPath = requireText(body.projectPath, "projectPath");
				if (url.pathname === "/api/context/selection") {
					this.setSelection(projectPath, selectionOf(body.selection));
					json(response, 200, { ok: true });
					return;
				}
				if (url.pathname === "/api/project/initialize") {
					const template = requireTemplate(body.template);
					json(response, 200, {
						ok: true,
						project: await this.initialize(projectPath, template),
						preview: await this.startPreview(projectPath),
						state: await this.state(projectPath)
					});
					return;
				}
				if (url.pathname === "/api/preview/start") {
					json(response, 200, {
						ok: true,
						preview: await this.startPreview(projectPath)
					});
					return;
				}
				if (url.pathname === "/api/preview/stop") {
					json(response, 200, {
						ok: true,
						preview: await this.stopPreview(projectPath)
					});
					return;
				}
				if (url.pathname === "/api/publish") {
					json(response, 200, { ...await this.publish(projectPath, {
						platform: requirePublishPlatform(body.platform),
						...typeof body.outDir === "string" ? { outDir: body.outDir } : {},
						...body.release ? { release: true } : {},
						...body.verbose ? { verbose: true } : {}
					}) });
					return;
				}
			}
			json(response, 404, {
				ok: false,
				error: "Not found"
			});
		} catch (error) {
			json(response, 400, {
				ok: false,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}
};
async function copyDirectoryContents(source, target) {
	for (const entry of await readdir(source, { withFileTypes: true })) {
		const from = join(source, entry.name);
		const to = join(target, entry.name);
		if (entry.isDirectory()) {
			await mkdir(to, { recursive: true });
			await copyDirectoryContents(from, to);
		} else await cp(from, to, {
			errorOnExist: true,
			force: false
		});
	}
}
function setCors(response) {
	response.setHeader("access-control-allow-origin", "*");
	response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
	response.setHeader("access-control-allow-headers", "content-type");
	response.setHeader("cache-control", "no-store");
}
function json(response, status, value) {
	response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	response.end(JSON.stringify(value));
}
async function readJson(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	if (!chunks.length) return {};
	const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Request body must be an object");
	return value;
}
function requireText(value, label) {
	if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
	return value.trim();
}
function requireTemplate(value) {
	if (value === "base-ai" || value === "base-ai-3d") return value;
	throw new Error("template must be base-ai or base-ai-3d");
}
function requirePublishPlatform(value) {
	if (value === void 0) return "web-desktop";
	if (value === "web-desktop" || value === "web-mobile") return value;
	throw new Error("platform must be web-desktop or web-mobile");
}
async function assignProjectIdentity(projectPath) {
	const packagePath = join(projectPath, "package.json");
	const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
	packageJson.name = basename(projectPath);
	packageJson.uuid = randomUUID();
	await writeFile(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`);
}
async function detectDimension(projectPath) {
	try {
		return JSON.parse(await readFile(join(projectPath, "settings", "v2", "packages", "engine.json"), "utf8")).modules?.configs?.defaultConfig?.cache?.["3d"]?._value === true ? "3d" : "2d";
	} catch {
		return "2d";
	}
}
function inspectProjectSync(projectPath) {
	try {
		const packageJson = JSON.parse(readFileSync(join(projectPath, "package.json"), "utf8"));
		if (typeof packageJson.creator?.version !== "string") return void 0;
		return {
			name: typeof packageJson.name === "string" && packageJson.name.trim() ? packageJson.name : basename(projectPath),
			projectPath,
			creatorVersion: packageJson.creator.version,
			dimension: detectDimensionSync(projectPath)
		};
	} catch {
		return;
	}
}
function readAuthoringGuide(projectPath) {
	for (const file of ["AGENTS.md", "AGENT_AUTHORING.md"]) try {
		const guide = readFileSync(join(projectPath, file), "utf8").trim();
		if (guide) return guide.slice(0, 48e3);
	} catch {}
}
function detectDimensionSync(projectPath) {
	try {
		return JSON.parse(readFileSync(join(projectPath, "settings", "v2", "packages", "engine.json"), "utf8")).modules?.configs?.defaultConfig?.cache?.["3d"]?._value === true ? "3d" : "2d";
	} catch {
		return "2d";
	}
}
function selectionOf(value) {
	if (value === null || value === void 0) return void 0;
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("selection must be an object or null");
	const candidate = value;
	if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.path !== "string" || typeof candidate.active !== "boolean" || !Array.isArray(candidate.componentTypes) || !candidate.componentTypes.every((item) => typeof item === "string")) throw new Error("selection is invalid");
	return {
		id: candidate.id,
		name: candidate.name,
		path: candidate.path,
		active: candidate.active,
		componentTypes: candidate.componentTypes
	};
}
async function findAvailablePortPair(start) {
	for (let port = start; port < start + 200; port += 2) if (await portAvailable(port) && await portAvailable(port + 1)) return port;
	throw new Error(`No free preview port pair near ${start}`);
}
async function portAvailable(port) {
	const server = createServer();
	return new Promise((resolvePromise) => {
		server.once("error", () => resolvePromise(false));
		server.listen(port, () => {
			server.close(() => resolvePromise(true));
		});
	});
}
function normalizePath(path) {
	const absolutePath = resolve(path);
	return process.platform === "win32" ? absolutePath.toLowerCase() : absolutePath;
}
function isMissingFile(error) {
	return !!error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}
async function runCommandCapture(command, args, cwd, env) {
	return await new Promise((resolvePromise, reject) => {
		const child = spawn(command, args, {
			cwd,
			...env ? { env } : {},
			stdio: "pipe",
			windowsHide: true
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.once("error", reject);
		child.once("exit", (code) => {
			resolvePromise({
				stdout,
				stderr,
				code: code ?? 1
			});
		});
	});
}
//#endregion
//#region src/project/unzip.ts
const END_OF_CENTRAL_DIR = 101010256;
const CENTRAL_FILE = 33639248;
const LOCAL_FILE = 67324752;
/** Extracts a (non-zip64, unencrypted) zip into dest without relying on a system `unzip`. */
async function extractZip(zipPath, dest) {
	const zip = await readFile(zipPath);
	let eocd = -1;
	for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 65535); i--) if (zip.readUInt32LE(i) === END_OF_CENTRAL_DIR) {
		eocd = i;
		break;
	}
	if (eocd < 0) throw new Error(`${zipPath} is not a zip file`);
	const root = resolve(dest);
	const count = zip.readUInt16LE(eocd + 10);
	let p = zip.readUInt32LE(eocd + 16);
	for (let n = 0; n < count; n++) {
		if (zip.readUInt32LE(p) !== CENTRAL_FILE) throw new Error(`${zipPath}: corrupt central directory`);
		const flags = zip.readUInt16LE(p + 8);
		const method = zip.readUInt16LE(p + 10);
		const size = zip.readUInt32LE(p + 20);
		const nameLength = zip.readUInt16LE(p + 28);
		const next = p + 46 + nameLength + zip.readUInt16LE(p + 30) + zip.readUInt16LE(p + 32);
		const localHeader = zip.readUInt32LE(p + 42);
		const name = zip.toString("utf8", p + 46, p + 46 + nameLength);
		p = next;
		if (flags & 1) throw new Error(`${zipPath}: encrypted entries are not supported`);
		if (size === 4294967295 || localHeader === 4294967295) throw new Error(`${zipPath}: zip64 is not supported`);
		const target = resolve(root, name);
		if (target !== root && !target.startsWith(root + sep)) throw new Error(`${zipPath}: entry escapes target dir: ${name}`);
		if (name.endsWith("/")) {
			await mkdir(target, { recursive: true });
			continue;
		}
		if (zip.readUInt32LE(localHeader) !== LOCAL_FILE) throw new Error(`${zipPath}: corrupt local header for ${name}`);
		const start = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
		const raw = zip.subarray(start, start + size);
		let data;
		if (method === 0) data = raw;
		else if (method === 8) data = inflateRawSync(raw);
		else throw new Error(`${zipPath}: unsupported compression method ${method} for ${name}`);
		await mkdir(dirname(target), { recursive: true });
		await writeFile(target, data);
	}
}
//#endregion
//#region src/project/kit.ts
const KURA_BASE = process.env.KURA_BASE_URL || "https://kuroneko.chat/assets";
const KIT_ID = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const SKIP_DIRS = /* @__PURE__ */ new Set([
	"native",
	"source",
	"previews",
	"thumbs",
	"__macosx",
	"node_modules"
]);
const KINDS = {
	".glb": "models",
	".gltf": "models",
	".bin": "models",
	".wav": "audio",
	".mp3": "audio",
	".ogg": "audio",
	".m4a": "audio"
};
async function walk(dir, root = dir) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(entry.name.toLowerCase())) out.push(...await walk(path, root));
		} else out.push(relative(root, path));
	}
	return out;
}
async function unzip(zip) {
	const dir = await mkdtemp(join(tmpdir(), "kurenai-kit-"));
	await extractZip(zip, dir);
	return dir;
}
/** Downloads a Kura studio pack (public read) and returns the zip path. */
async function fetchKuraPack(id) {
	const plan = await (await fetch(`${KURA_BASE}/api/fetch?providerId=studio&externalId=${encodeURIComponent(id)}`)).json();
	const url = plan?.files?.find((f) => f.url?.includes("pack.zip"))?.url ?? plan?.acquireHint?.zipUrl ?? `${KURA_BASE}/api/studio-file?externalId=${encodeURIComponent(id)}&path=pack.zip`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Kura pack "${id}" not found (${response.status} ${url})`);
	const zip = join(await mkdtemp(join(tmpdir(), "kurenai-kit-")), `${id}.zip`);
	await writeFile(zip, Buffer.from(await response.arrayBuffer()));
	return zip;
}
/** A zip may wrap everything in one top-level folder. */
async function packRoot(dir) {
	const entries = (await readdir(dir)).filter((name) => name !== "__MACOSX");
	if (entries.length === 1 && statSync(join(dir, entries[0])).isDirectory()) return join(dir, entries[0]);
	return dir;
}
async function ignorePatterns(root) {
	try {
		const spec = JSON.parse(await readFile(join(root, "kura-pack.json"), "utf8"));
		return Array.isArray(spec.ignore) ? spec.ignore.map((p) => new RegExp(p)) : [];
	} catch {
		return [];
	}
}
/**
* Copies a kit's web assets into assets/resources/kits/<kit>/{models,audio}/ so that
* `loadModel('kits/<kit>/models/<Name>')` works. Accepts a folder, a .zip, or a Kura
* studio pack id (e.g. `ks-survivor-kit`).
*/
async function addKit(projectPath, source, name) {
	const cleanup = [];
	try {
		let root;
		let kit;
		const local = resolve(source);
		if (existsSync(local) && statSync(local).isDirectory()) {
			root = local;
			kit = name ?? basename(local);
		} else if (existsSync(local) && extname(local).toLowerCase() === ".zip") {
			const dir = await unzip(local);
			cleanup.push(dir);
			root = await packRoot(dir);
			kit = name ?? basename(local, ".zip");
		} else if (KIT_ID.test(source)) {
			const zip = await fetchKuraPack(source);
			cleanup.push(dirname(zip));
			const dir = await unzip(zip);
			cleanup.push(dir);
			root = await packRoot(dir);
			kit = name ?? source;
		} else throw new Error(`kit source must be a folder, a .zip or a Kura pack id: ${source}`);
		if (!KIT_ID.test(kit)) throw new Error(`kit name must match ${KIT_ID}: ${kit} (pass --name)`);
		const ignore = await ignorePatterns(root);
		const resources = join("assets", "resources", "kits", kit);
		const models = [];
		const audio = [];
		let skipped = 0;
		for (const file of await walk(root)) {
			const kind = KINDS[extname(file).toLowerCase()];
			if (!kind || ignore.some((re) => re.test(basename(file)))) {
				skipped += 1;
				continue;
			}
			const parts = file.split(sep);
			const inner = parts.length > 1 ? parts.slice(1).join(sep) : file;
			const target = join(projectPath, resources, kind, inner);
			await mkdir(dirname(target), { recursive: true });
			await copyFile(join(root, file), target);
			const resPath = join("kits", kit, kind, inner).split(sep).join("/").replace(/\.[^.]+$/, "");
			if (kind === "models" && extname(file).toLowerCase() !== ".bin") models.push(resPath);
			if (kind === "audio") audio.push(resPath);
		}
		if (!models.length && !audio.length) throw new Error(`no .glb/.gltf or audio files found in ${source}`);
		let readme;
		for (const candidate of [
			"README.md",
			"readme.md",
			"README.txt"
		]) if (existsSync(join(root, candidate))) {
			readme = join("docs", "kits", `${kit}.md`);
			await mkdir(join(projectPath, "docs", "kits"), { recursive: true });
			await copyFile(join(root, candidate), join(projectPath, readme));
			break;
		}
		return {
			ok: true,
			kit,
			resources: resources.split(sep).join("/"),
			models,
			audio,
			...readme ? { readme: readme.split(sep).join("/") } : {},
			skipped
		};
	} finally {
		for (const dir of cleanup) await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
//#endregion
//#region src/meta/asset-info.ts
/** Absolute path of `file` if it lies inside `<project>/assets`, else undefined. */
function assetPathInProject(project, file) {
	const assetsDir = join(resolve(project), "assets");
	const target = resolve(file);
	if (target !== assetsDir && !target.startsWith(assetsDir + sep)) return void 0;
	return target;
}
/**
* Reads uuid / importer / sub-assets from an existing `.meta` without starting the
* host. Throws when the file has not been imported yet.
*/
async function readAssetInfo(project, file) {
	const target = assetPathInProject(project, file);
	if (!target) throw new Error(`path must be inside ${join(resolve(project), "assets")}`);
	if (!existsSync(target)) throw new Error(`no such file: ${relative(project, target)}`);
	const metaPath = `${target}.meta`;
	if (!existsSync(metaPath)) throw new Error(`not imported yet (no .meta): run \`kurenai import ${relative(process.cwd(), target) || target}\``);
	const meta = JSON.parse(await readFile(metaPath, "utf8"));
	if (!meta.uuid) throw new Error(`${relative(project, metaPath)} has no uuid`);
	const subAssets = [];
	const collect = (subMetas) => {
		for (const sub of Object.values(subMetas ?? {})) {
			if (sub.uuid) subAssets.push({
				uuid: sub.uuid,
				...sub.name ? { name: sub.name } : {},
				...sub.importer ? { importer: sub.importer } : {}
			});
			collect(sub.subMetas);
		}
	};
	collect(meta.subMetas);
	const rel = relative(resolve(project), target).split(sep).join("/");
	return {
		path: rel,
		url: `db://${rel}`,
		uuid: meta.uuid,
		importer: meta.importer ?? "unknown",
		imported: meta.imported !== false,
		subAssets
	};
}
/** Files under `path` (or `path` itself), skipping `.meta` and dotfiles. */
function listImportTargets(path) {
	const target = resolve(path);
	if (!statSync(target).isDirectory()) return [target];
	const files = [];
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name.startsWith(".") || entry.name.endsWith(".meta")) continue;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.isFile()) files.push(full);
		}
	};
	walk(target);
	return files.sort();
}
//#endregion
export { DEFAULT_COCOS_CLI_ROOT, DEFAULT_HOST_READY_TIMEOUT_MS, KURENAI_COCOS_CORE_VERSION, KURENAI_PROTOCOL_VERSION, LEGACY_PINK_COCOS_CLI_ROOT, PreviewBridge, PreviewController, ProjectControl, addKit, addonsDir, applyEngineCuts, applyEngineModules, applyMinimalEngineModules, assetPathInProject, bundledCocosCoreRoot, ensureAddon, ensureCorePack, ensurePacks, findMissingEngineModules, formatSelectionContext, injectInspector, inspectPack, isInspectorMessage, listImportTargets, listKnownPackIds, loadAddon, managedCocosCoreRoot, modulesFromArtifacts, packageRoot, packsForPlatform, packsStatus, platformAddon, proposeEngineCuts, readAssetInfo, resolveCocosCliRoot, resolveHostReadyTimeoutMs };

//# sourceMappingURL=index.js.map