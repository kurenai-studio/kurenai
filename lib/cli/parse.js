import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
//#region src/cli/parse.ts
const CLI_BOOLEAN_FLAGS = /* @__PURE__ */ new Set([
	"errors",
	"verbose",
	"fetch"
]);
function parseArgs(argv) {
	const positional = [];
	const options = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith("--")) positional.push(arg);
		else if (CLI_BOOLEAN_FLAGS.has(arg.slice(2))) options[arg.slice(2)] = true;
		else {
			const value = argv[++i];
			if (value !== void 0) options[arg.slice(2)] = value;
		}
	}
	return {
		positional,
		options
	};
}
function findProject(from) {
	let dir = resolve(from);
	if (existsSync(dir) && statSync(dir).isFile()) dir = dirname(dir);
	for (;;) {
		if (existsSync(join(dir, "assets")) && existsSync(join(dir, "package.json"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return void 0;
		dir = parent;
	}
}
function resolveProjectDir(options, hint, cwd = process.cwd()) {
	const project = typeof options.project === "string" ? resolve(options.project) : findProject(hint ?? cwd);
	if (!project || !existsSync(join(project, "assets"))) throw new Error("no Cocos project found; pass --project <dir>");
	return project;
}
function wantsHelp(argv) {
	return argv[0] === "help" || argv.includes("--help") || argv.includes("-h");
}
//#endregion
export { CLI_BOOLEAN_FLAGS, findProject, parseArgs, resolveProjectDir, wantsHelp };

//# sourceMappingURL=parse.js.map