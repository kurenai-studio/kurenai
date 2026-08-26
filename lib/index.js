import { n as formatSelectionContext, r as isInspectorMessage, t as KURENAI_PROTOCOL_VERSION } from "./protocol-3dNTvjX9.js";
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import httpProxy from "http-proxy";
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
				const html = injectInspector(await upstream.text());
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
function injectInspector(html) {
	const tag = "<script src=\"/__kurenai/inspector.js\"><\/script>";
	if (html.includes(tag)) return html;
	const bodyEnd = html.lastIndexOf("</body>");
	return bodyEnd >= 0 ? `${html.slice(0, bodyEnd)}${tag}${html.slice(bodyEnd)}` : `${html}${tag}`;
}
//#endregion
//#region src/preview/controller.ts
const DEFAULT_PORT = 7460;
const MAX_LOG_LINES = 80;
var PreviewController = class {
	config;
	child;
	bridge;
	upstreamUrl;
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
		const project = requireDirectory$1("project", merged.project ?? process.env.KURENAI_PROJECT ?? process.cwd());
		const headlessRoot = requireDirectory$1("headlessRoot", merged.headlessRoot ?? process.env.KURENAI_HEADLESS_ROOT ?? process.env.HEADLESS_STACK);
		const entry = resolve(headlessRoot, merged.previewEntry ?? "spike/preview-mirror.mjs");
		if (!existsSync(entry)) throw new Error(`Headless Cocos preview entry does not exist: ${entry}`);
		const port = merged.port ?? DEFAULT_PORT;
		const bridgePort = merged.bridgePort ?? port + 1;
		this.upstreamUrl = `http://127.0.0.1:${port}/`;
		this.state = {
			phase: "starting",
			url: `http://127.0.0.1:${bridgePort}/`,
			project,
			startedAt: (/* @__PURE__ */ new Date()).toISOString(),
			recentLogs: []
		};
		const child = this.spawnProcess(process.execPath, [entry], {
			cwd: headlessRoot,
			env: {
				...process.env,
				PROJECT: project,
				PORT: String(port),
				PACKER: merged.packer ?? "mini"
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
				this.state.lastError = `preview exited (code=${String(code)}, signal=${String(signal)})`;
			}
		});
		try {
			await this.waitUntilReady(merged.readinessTimeoutMs ?? 3e4);
			const bridgeConfig = {
				upstreamUrl: this.upstreamUrl,
				port: bridgePort,
				...merged.inspectorScriptPath ? { inspectorScriptPath: merged.inspectorScriptPath } : {}
			};
			this.bridge = new PreviewBridge(bridgeConfig);
			this.state.url = await this.bridge.start();
			this.state.phase = "ready";
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
	recordLog(chunk) {
		const next = chunk.split(/\r?\n/u).map((line) => line.trimEnd()).filter(Boolean);
		this.state.recentLogs.push(...next);
		if (this.state.recentLogs.length > MAX_LOG_LINES) this.state.recentLogs.splice(0, this.state.recentLogs.length - MAX_LOG_LINES);
	}
	async waitUntilReady(timeoutMs) {
		const deadline = Date.now() + timeoutMs;
		let lastError = "preview did not answer";
		while (Date.now() < deadline) {
			if (!this.child) throw new Error(this.state.lastError ?? "preview exited before ready");
			try {
				const response = await this.fetchImpl(new URL("/__hmr/status", this.upstreamUrl), { signal: AbortSignal.timeout(1500) });
				if (response.ok) return;
				lastError = `HTTP ${response.status}`;
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);
			}
			await new Promise((done) => setTimeout(done, 250));
		}
		throw new Error(`Headless Cocos preview was not ready after ${timeoutMs}ms: ${lastError}`);
	}
};
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
	}, 2e3))]);
}
function requireDirectory$1(label, value) {
	if (!value?.trim()) throw new Error(`${label} is required`);
	const path = resolve(value);
	if (!existsSync(path)) throw new Error(`${label} does not exist: ${path}`);
	return path;
}
//#endregion
//#region src/project/control.ts
const DSH_WORKSPACE_METADATA = /* @__PURE__ */ new Set([".evolve", ".dsh-home"]);
var ProjectControl = class {
	config;
	server;
	previews = /* @__PURE__ */ new Map();
	projects = /* @__PURE__ */ new Map();
	selections = /* @__PURE__ */ new Map();
	runCommand;
	constructor(config) {
		this.config = config;
		this.runCommand = config.runCommand ?? runCommand;
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
		if (await this.inspect(target)) throw new Error("This DSH workspace is already a Cocos Creator project");
		const entries = await readdir(target);
		const projectEntries = entries.filter((entry) => !DSH_WORKSPACE_METADATA.has(entry));
		if (projectEntries.length) throw new Error(`Cocos initialization requires an empty DSH workspace directory; found: ${projectEntries.join(", ")}`);
		const configuredRoot = template === "base-ai-3d" ? this.config.template3dRoot : this.config.templateRoot;
		const templateRoot = configuredRoot ? resolve(configuredRoot) : void 0;
		if (templateRoot) await copyDirectoryContents(templateRoot, target);
		else {
			const configuredHeadlessRoot = this.config.headlessRoot ?? process.env.KURENAI_HEADLESS_ROOT ?? process.env.HEADLESS_STACK;
			if (!configuredHeadlessRoot) throw new Error("KURENAI_HEADLESS_ROOT must point to the supplied headless-cocos repository");
			const headlessRoot = resolve(configuredHeadlessRoot);
			const creator = join(headlessRoot, "spike", "create-project.mjs");
			if (!existsSync(creator)) throw new Error("KURENAI_HEADLESS_ROOT must point to the supplied headless-cocos repository");
			await this.runCommand(process.execPath, [
				creator,
				"--template",
				template,
				"--out",
				target,
				...entries.length ? ["--force"] : []
			], headlessRoot);
		}
		const project = await this.inspect(target);
		if (!project) throw new Error("The initialized template is not a Cocos Creator project");
		return project;
	}
	async state(sessionId, projectPath) {
		const absolutePath = resolve(projectPath);
		const project = await this.inspect(absolutePath);
		const preview = this.previews.get(normalizePath(absolutePath))?.snapshot();
		return {
			sessionId,
			projectPath: absolutePath,
			...project ? { project } : {},
			...preview ? { preview } : {}
		};
	}
	async startPreview(projectPath) {
		const project = await this.inspect(projectPath);
		if (!project) throw new Error("The DSH workspace is not a Cocos Creator project");
		return (await this.previewFor(project.projectPath)).start({ project: project.projectPath });
	}
	async stopPreview(projectPath) {
		return (await this.previewFor(resolve(projectPath))).stop();
	}
	async publish(projectPath, options = {}) {
		const absolutePath = resolve(projectPath);
		if (!await this.inspect(absolutePath)) throw new Error("The DSH workspace is not a Cocos Creator project");
		const headlessRoot = requireDirectory("headlessRoot", this.config.headlessRoot ?? process.env.KURENAI_HEADLESS_ROOT ?? process.env.HEADLESS_STACK);
		const platform = options.platform ?? "web";
		const outDir = options.outDir ?? join(absolutePath, "dist", platform);
		const cli = join(headlessRoot, "spike", "publish", "cli.mjs");
		if (!existsSync(cli)) throw new Error(`Publish CLI missing: ${cli}`);
		const args = [
			cli,
			`--project=${absolutePath}`,
			`--platform=${platform}`,
			`--out=${outDir}`
		];
		if (options.skipPacker) args.push("--skip-packer");
		const { stdout, stderr, code } = await runCommandCapture(process.execPath, args, headlessRoot);
		const combined = `${stdout}\n${stderr}`.trim();
		let parsed;
		const jsonMatch = combined.match(/\{[\s\S]*"ok"\s*:\s*(true|false)[\s\S]*\}\s*$/);
		if (jsonMatch) try {
			parsed = JSON.parse(jsonMatch[0]);
		} catch {
			parsed = void 0;
		}
		if (code !== 0) return {
			ok: false,
			platform,
			outDir,
			exitCode: code,
			error: typeof parsed?.error === "string" && parsed.error || combined.slice(-4e3) || "publish failed",
			logTail: combined.slice(-2e3)
		};
		return {
			ok: true,
			platform,
			outDir,
			...parsed ?? {},
			logTail: combined.slice(-1500)
		};
	}
	setSelection(sessionId, selection) {
		if (selection) this.selections.set(sessionId, selection);
		else this.selections.delete(sessionId);
	}
	contextText(sessionId, projectPath) {
		const absolutePath = resolve(projectPath);
		const key = normalizePath(absolutePath);
		const project = this.projects.get(key) ?? inspectProjectSync(absolutePath);
		if (project) this.projects.set(key, project);
		const preview = this.previews.get(key)?.snapshot();
		const selection = this.selections.get(sessionId);
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
		if (authoringGuide) lines.push("", "[Kurenai headless authoring skill]", "These project-specific rules are mandatory for every Cocos edit in this session:", authoringGuide);
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
				const sessionId = requireText(url.searchParams.get("sessionId"), "sessionId");
				const projectPath = requireText(url.searchParams.get("projectPath"), "projectPath");
				json(response, 200, await this.state(sessionId, projectPath));
				return;
			}
			if (request.method === "POST") {
				const body = await readJson(request);
				const sessionId = requireText(body.sessionId, "sessionId");
				const projectPath = requireText(body.projectPath, "projectPath");
				if (url.pathname === "/api/context/selection") {
					this.setSelection(sessionId, selectionOf(body.selection));
					json(response, 200, { ok: true });
					return;
				}
				if (url.pathname === "/api/project/initialize") {
					const template = requireTemplate$1(body.template);
					json(response, 200, {
						ok: true,
						project: await this.initialize(projectPath, template),
						preview: await this.startPreview(projectPath),
						state: await this.state(sessionId, projectPath)
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
						platform: typeof body.platform === "string" ? body.platform : "web",
						...typeof body.outDir === "string" ? { outDir: body.outDir } : {},
						skipPacker: body.skipPacker === true
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
	for (const entry of await readdir(source, { withFileTypes: true })) await cp(join(source, entry.name), join(target, entry.name), {
		recursive: entry.isDirectory(),
		errorOnExist: true,
		force: false
	});
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
function requireTemplate$1(value) {
	if (value === "base-ai" || value === "base-ai-3d") return value;
	throw new Error("template must be base-ai or base-ai-3d");
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
	try {
		const guide = readFileSync(join(projectPath, "AGENT_AUTHORING.md"), "utf8").trim();
		return guide ? guide.slice(0, 48e3) : void 0;
	} catch {
		return;
	}
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
	throw new Error(`No free Headless Cocos port pair near ${start}`);
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
async function runCommand(command, args, cwd) {
	await new Promise((resolvePromise, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: "pipe",
			windowsHide: true
		});
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.once("error", reject);
		child.once("exit", (code) => {
			if (code === 0) resolvePromise();
			else reject(/* @__PURE__ */ new Error(`${command} failed (${String(code)}): ${stderr.trim()}`));
		});
	});
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
function requireDirectory(label, value) {
	if (!value?.trim()) throw new Error(`${label} is required`);
	const absolute = resolve(value);
	if (!existsSync(absolute)) throw new Error(`${label} does not exist: ${absolute}`);
	return absolute;
}
//#endregion
//#region src/index.ts
const name = "kurenai";
const inject = ["tools", "systemPrompt"];
function tool(name, description, parameters, execute) {
	return {
		name,
		description,
		parameters,
		output: {
			schema: {
				type: "object",
				additionalProperties: true
			},
			render(_args, value) {
				return [{
					type: "text",
					text: JSON.stringify(value, null, 2)
				}];
			}
		},
		execute: (args, execution) => execute(args ?? {}, execution)
	};
}
function stateResult(state) {
	return {
		ok: state.phase !== "failed",
		...state
	};
}
function apply(ctx, config = {}) {
	const control = new ProjectControl(config);
	const logger = ctx.logger?.("kurenai");
	ctx.tools.register(tool("kurenai_project_initialize", "Initialize the current DSH workspace as a Cocos project from the Kurenai base template.", {
		type: "object",
		additionalProperties: false,
		required: ["template"],
		properties: { template: {
			type: "string",
			enum: ["base-ai", "base-ai-3d"],
			description: "2D or 3D headless-cocos project template"
		} }
	}, async (args, execution) => {
		try {
			const current = requireProjectContext(execution);
			return {
				ok: true,
				project: await control.initialize(current.projectPath, requireTemplate(args.template)),
				preview: await control.startPreview(current.projectPath)
			};
		} catch (error) {
			return errorResult(error);
		}
	}));
	ctx.tools.register(tool("kurenai_project_current", "Inspect the current DSH workspace and return its Cocos project and preview state.", {
		type: "object",
		additionalProperties: false,
		properties: {}
	}, async (_args, execution) => {
		try {
			const current = requireProjectContext(execution);
			return {
				ok: true,
				...await control.state(current.sessionId, current.projectPath)
			};
		} catch (error) {
			return errorResult(error);
		}
	}));
	ctx.tools.register(tool("kurenai_preview_start", "Start the Headless Cocos preview for the current project. Call before asking the user to open Kurenai Studio.", {
		type: "object",
		additionalProperties: false,
		properties: {}
	}, async (_args, execution) => {
		try {
			const current = requireProjectContext(execution);
			const project = await control.inspect(current.projectPath);
			if (!project) throw new Error("Current DSH workspace is not a Cocos project");
			const state = await control.startPreview(current.projectPath);
			logger?.info?.("Headless Cocos preview ready", state.url);
			return {
				...stateResult(state),
				project
			};
		} catch (error) {
			logger?.error?.("Failed to start Headless Cocos preview", error);
			return errorResult(error);
		}
	}));
	ctx.tools.register(tool("kurenai_preview_status", "Return the current Kurenai Headless Cocos preview state and URL.", {
		type: "object",
		additionalProperties: false,
		properties: {}
	}, async (_args, execution) => {
		try {
			const current = requireProjectContext(execution);
			return {
				ok: true,
				...await control.state(current.sessionId, current.projectPath)
			};
		} catch (error) {
			return errorResult(error);
		}
	}));
	ctx.tools.register(tool("kurenai_preview_stop", "Stop the current Kurenai Headless Cocos preview process.", {
		type: "object",
		additionalProperties: false,
		properties: {}
	}, async (_args, execution) => {
		try {
			const current = requireProjectContext(execution);
			return { ...stateResult(await control.stopPreview(current.projectPath)) };
		} catch (error) {
			return errorResult(error);
		}
	}));
	ctx.tools.register(tool("kurenai_publish", "Headless publish: freeze the project into a static dist (default platform=web). No Cocos Creator install required.", {
		type: "object",
		additionalProperties: false,
		properties: {
			platform: {
				type: "string",
				enum: ["web"],
				description: "Platform plugin id (extensible; MVP: web)"
			},
			outDir: {
				type: "string",
				description: "Optional output directory (default: <project>/dist/<platform>)"
			},
			skipPacker: {
				type: "boolean",
				description: "Reuse existing packer output instead of rebuilding scripts"
			}
		}
	}, async (args, execution) => {
		try {
			const current = requireProjectContext(execution);
			return await control.publish(current.projectPath, {
				platform: typeof args.platform === "string" ? args.platform : "web",
				...typeof args.outDir === "string" ? { outDir: args.outDir } : {},
				skipPacker: args.skipPacker === true
			});
		} catch (error) {
			return errorResult(error);
		}
	}));
	ctx.systemPrompt?.section({
		name: "kurenai:selected-node",
		order: 120,
		text: [
			"Kurenai Studio provides a Headless Cocos preview and runtime node inspector.",
			"The current DSH session cwd is the Cocos project root; do not maintain a separate Kurenai workspace path.",
			"When the user includes a '[Kurenai selected Cocos node]' block, treat its path and source ids as the target of phrases such as 'this node' or 'this button'.",
			"Edit project source files on disk; do not mutate only the browser runtime because changes must survive reload."
		].join(" ")
	});
	ctx.systemPrompt?.context({
		name: "kurenai:current-project",
		order: 120,
		text: (assembly) => {
			const sessionId = assembly.agent?.id;
			const projectPath = assembly.agent?.session.header.cwd;
			return sessionId && projectPath ? control.contextText(sessionId, projectPath) : "";
		}
	});
	ctx.effect?.(() => {
		control.startServer().then((url) => logger?.info?.("Kurenai project control ready", url), (error) => logger?.error?.("Kurenai project control failed", error));
		return async () => {
			await control.stopServer();
		};
	});
}
function requireProjectContext(execution) {
	const sessionId = execution?.agent?.id;
	if (!sessionId) throw new Error("Kurenai tool requires an active DSH conversation");
	const projectPath = execution.agent?.session?.header?.cwd;
	if (!projectPath) throw new Error("Current DSH conversation does not have a workspace directory");
	return {
		sessionId,
		projectPath
	};
}
function errorResult(error) {
	return {
		ok: false,
		error: error instanceof Error ? error.message : String(error)
	};
}
function requireTemplate(value) {
	if (value === "base-ai" || value === "base-ai-3d") return value;
	throw new Error("template must be base-ai or base-ai-3d");
}
//#endregion
export { KURENAI_PROTOCOL_VERSION, PreviewController, ProjectControl, apply, formatSelectionContext, inject, isInspectorMessage, name };

//# sourceMappingURL=index.js.map