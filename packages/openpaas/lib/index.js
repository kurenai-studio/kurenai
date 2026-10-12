import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/plugin.ts
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The bundled Cocos 4 openpaas builder plugin (directory name sudv2). */
function pluginInfo() {
	const dir = join(packageRoot, "plugin", "sudv2");
	const markerFile = join(dir, ".kurenai-pack.json");
	if (!existsSync(markerFile)) throw new Error(`Bundled OpenPaaS plugin missing: ${dir}`);
	return {
		...JSON.parse(readFileSync(markerFile, "utf8")),
		dir
	};
}
function packageVersion() {
	return JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")).version;
}
/**
* Install the plugin into a cocos-cli root as packages/platforms/sudv2, where the builder
* discovers platform plugins. Refuses a cocos-cli whose engine version differs from the plugin's.
*/
function installPlugin(cocosCliRoot) {
	const root = resolve(cocosCliRoot);
	const { dir: pluginDir, ...plugin } = pluginInfo();
	const enginePkg = join(root, "packages", "engine", "package.json");
	if (!existsSync(enginePkg)) throw new Error(`Not a cocos-cli root (no packages/engine): ${root}`);
	const engineVersion = JSON.parse(readFileSync(enginePkg, "utf8")).version;
	if (engineVersion !== plugin.engineVersion) throw new Error(`OpenPaaS plugin is for engine ${plugin.engineVersion}, but ${root} has engine ${engineVersion}`);
	const dest = join(root, "packages", "platforms", "sudv2");
	const replaced = existsSync(dest);
	rmSync(dest, {
		recursive: true,
		force: true
	});
	cpSync(pluginDir, dest, { recursive: true });
	const marker = {
		...plugin,
		source: `@kurenai-studio/openpaas@${packageVersion()}`,
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
//#region src/credentials.ts
/** Same hosts the sudv2 plugin uses. A custom base URL replaces the table. */
const UPLOAD_BASE_URLS = {
	dev: "https://dev-agent-api.s00.tech",
	fat: "https://fat-agent-api.s00.tech",
	prod: "https://cn-000-agent-api.s01.tech"
};
function normalizeUploadEnv(value) {
	return value === "dev" || value === "fat" || value === "prod" ? value : void 0;
}
/**
* Token order matches the sudv2 plugin: option, OPENPAAS_ACCESS_TOKEN, SUD_ACCESS_TOKEN.
* Environment order matches too: option, OPENPAAS_UPLOAD_ENV, SUD_UPLOAD_ENV, then prod.
*/
function resolveCredentials(options = {}, env = process.env) {
	const accessToken = String(options.accessToken || env.OPENPAAS_ACCESS_TOKEN || env.SUD_ACCESS_TOKEN || "").trim();
	if (!accessToken) throw new Error("Missing OpenPaaS access token. Set OPENPAAS_ACCESS_TOKEN or SUD_ACCESS_TOKEN.");
	const customBaseUrl = String(options.uploadBaseUrl || env.OPENPAAS_UPLOAD_BASE_URL || "").trim();
	const uploadEnv = normalizeUploadEnv(options.uploadEnv) ?? normalizeUploadEnv(env.OPENPAAS_UPLOAD_ENV) ?? normalizeUploadEnv(env.SUD_UPLOAD_ENV) ?? "prod";
	return {
		accessToken,
		uploadEnv,
		baseUrl: customBaseUrl ? customBaseUrl.replace(/\/$/, "") : UPLOAD_BASE_URLS[uploadEnv]
	};
}
/** Fail before a build starts when no PinK token is available. Does not print the token. */
function assertCredentials(options = {}, env) {
	return resolveCredentials(options, env);
}
//#endregion
export { UPLOAD_BASE_URLS, assertCredentials, installPlugin, pluginInfo, resolveCredentials };

//# sourceMappingURL=index.js.map