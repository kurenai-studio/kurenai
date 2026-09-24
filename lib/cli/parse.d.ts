//#region src/cli/parse.d.ts
declare const CLI_BOOLEAN_FLAGS: Set<string>;
type CliOptions = Record<string, string | true>;
declare function parseArgs(argv: string[]): {
  positional: string[];
  options: CliOptions;
};
declare function findProject(from: string): string | undefined;
declare function resolveProjectDir(options: CliOptions, hint?: string, cwd?: string): string;
declare function wantsHelp(argv: string[]): boolean;
//#endregion
export { CLI_BOOLEAN_FLAGS, CliOptions, findProject, parseArgs, resolveProjectDir, wantsHelp };
//# sourceMappingURL=parse.d.ts.map