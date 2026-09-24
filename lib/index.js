import { n as formatSelectionContext, r as isInspectorMessage, t as KURENAI_PROTOCOL_VERSION } from "./protocol-3dNTvjX9.js";
import { existsSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import httpProxy from "http-proxy";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
//#region src/cocos/paths.ts
const DEFAULT_COCOS_CLI_ROOT = join(homedir(), "Library", "Application Support", "cocos-default", "cocos-4.0.0-alpha.33");
function resolveCocosCliRoot(configured) {
	return resolve(configured ?? process.env.KURENAI_COCOS_CLI_ROOT ?? DEFAULT_COCOS_CLI_ROOT);
}
function packageFile(relativePath) {
	const found = [`../${relativePath}`, `../../${relativePath}`].map((candidate) => fileURLToPath(new URL(candidate, import.meta.url))).find((candidate) => existsSync(candidate));
	if (!found) throw new Error(`Kurenai package file is missing: ${relativePath}`);
	return found;
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
//#region src/preview/controller.ts
const DEFAULT_PORT = 7460;
const DEFAULT_READINESS_TIMEOUT_MS = 18e4;
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
		try {
			await this.waitUntilReady(merged.readinessTimeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS);
			await this.startBridge(merged, bridgePort);
		} catch (error) {
			this.state.phase = "failed";
			this.state.lastError = error instanceof Error ? error.message : String(error);
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
		const cli = join(cocosCliRoot, "dist", "cli.js");
		if (!existsSync(cli)) throw new Error(`cocos-cli not found: ${cli}`);
		const platform = options.platform ?? "web-desktop";
		const args = [
			cli,
			"build",
			"--project",
			absolutePath,
			"--platform",
			platform
		];
		let configDir;
		if (options.outDir) {
			const outDir = resolve(absolutePath, options.outDir);
			configDir = await mkdtemp(join(tmpdir(), "kurenai-build-"));
			const configPath = join(configDir, "build-config.json");
			await writeFile(configPath, JSON.stringify({
				buildPath: dirname(outDir),
				outputName: basename(outDir)
			}));
			args.push("--build-config", configPath);
		}
		try {
			const { stdout, stderr, code } = await this.runCommand(process.execPath, args, absolutePath);
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
			return {
				ok: true,
				outDir,
				platform,
				...logTail !== void 0 ? { logTail } : {}
			};
		} finally {
			if (configDir) await rm(configDir, {
				recursive: true,
				force: true
			});
		}
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
async function runCommandCapture(command, args, cwd) {
	return await new Promise((resolvePromise, reject) => {
		const child = spawn(command, args, {
			cwd,
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
export { DEFAULT_COCOS_CLI_ROOT, KURENAI_PROTOCOL_VERSION, PreviewBridge, PreviewController, ProjectControl, formatSelectionContext, injectInspector, isInspectorMessage, resolveCocosCliRoot };

//# sourceMappingURL=index.js.map