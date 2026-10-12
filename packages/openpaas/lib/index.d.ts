//#region src/plugin.d.ts
type PluginMarker = {
  id: string;
  platform: string;
  pluginVersion: string;
  engineVersion: string;
};
/** The bundled Cocos 4 openpaas builder plugin (directory name sudv2). */
declare function pluginInfo(): PluginMarker & {
  dir: string;
};
/**
 * Install the plugin into a cocos-cli root as packages/platforms/sudv2, where the builder
 * discovers platform plugins. Refuses a cocos-cli whose engine version differs from the plugin's.
 */
declare function installPlugin(cocosCliRoot: string): {
  dir: string;
  engineVersion: string;
  replaced: boolean;
};
//#endregion
//#region src/credentials.d.ts
/** Same hosts the sudv2 plugin uses. A custom base URL replaces the table. */
declare const UPLOAD_BASE_URLS: {
  readonly dev: "https://dev-agent-api.s00.tech";
  readonly fat: "https://fat-agent-api.s00.tech";
  readonly prod: "https://cn-000-agent-api.s01.tech";
};
type UploadEnv = keyof typeof UPLOAD_BASE_URLS;
type CredentialInput = {
  accessToken?: string;
  uploadEnv?: string;
  uploadBaseUrl?: string;
};
type OpenPaasCredentials = {
  accessToken: string;
  uploadEnv: UploadEnv;
  baseUrl: string;
};
/**
 * Token order matches the sudv2 plugin: option, OPENPAAS_ACCESS_TOKEN, SUD_ACCESS_TOKEN.
 * Environment order matches too: option, OPENPAAS_UPLOAD_ENV, SUD_UPLOAD_ENV, then prod.
 */
declare function resolveCredentials(options?: CredentialInput, env?: NodeJS.ProcessEnv): OpenPaasCredentials;
/** Fail before a build starts when no PinK token is available. Does not print the token. */
declare function assertCredentials(options?: CredentialInput, env?: NodeJS.ProcessEnv): OpenPaasCredentials;
//#endregion
export { type CredentialInput, type OpenPaasCredentials, UPLOAD_BASE_URLS, type UploadEnv, assertCredentials, installPlugin, pluginInfo, resolveCredentials };
//# sourceMappingURL=index.d.ts.map