/** Same hosts the sudv2 plugin uses. A custom base URL replaces the table. */
export const UPLOAD_BASE_URLS = {
  dev: "https://dev-agent-api.s00.tech",
  fat: "https://fat-agent-api.s00.tech",
  prod: "https://cn-000-agent-api.s01.tech",
} as const;

export type UploadEnv = keyof typeof UPLOAD_BASE_URLS;

export type CredentialInput = {
  accessToken?: string;
  uploadEnv?: string;
  uploadBaseUrl?: string;
};

export type OpenPaasCredentials = {
  accessToken: string;
  uploadEnv: UploadEnv;
  baseUrl: string;
};

function normalizeUploadEnv(value: string | undefined): UploadEnv | undefined {
  return value === "dev" || value === "fat" || value === "prod" ? value : undefined;
}

/**
 * Token order matches the sudv2 plugin: option, OPENPAAS_ACCESS_TOKEN, SUD_ACCESS_TOKEN.
 * Environment order matches too: option, OPENPAAS_UPLOAD_ENV, SUD_UPLOAD_ENV, then prod.
 */
export function resolveCredentials(
  options: CredentialInput = {},
  env: NodeJS.ProcessEnv = process.env,
): OpenPaasCredentials {
  const accessToken = String(options.accessToken || env.OPENPAAS_ACCESS_TOKEN || env.SUD_ACCESS_TOKEN || "").trim();
  if (!accessToken) {
    throw new Error("Missing OpenPaaS access token. Set OPENPAAS_ACCESS_TOKEN or SUD_ACCESS_TOKEN.");
  }
  const customBaseUrl = String(options.uploadBaseUrl || env.OPENPAAS_UPLOAD_BASE_URL || "").trim();
  const uploadEnv =
    normalizeUploadEnv(options.uploadEnv) ??
    normalizeUploadEnv(env.OPENPAAS_UPLOAD_ENV) ??
    normalizeUploadEnv(env.SUD_UPLOAD_ENV) ??
    "prod";
  const baseUrl = customBaseUrl ? customBaseUrl.replace(/\/$/, "") : UPLOAD_BASE_URLS[uploadEnv];
  return { accessToken, uploadEnv, baseUrl };
}

/** Fail before a build starts when no PinK token is available. Does not print the token. */
export function assertCredentials(options: CredentialInput = {}, env?: NodeJS.ProcessEnv): OpenPaasCredentials {
  return resolveCredentials(options, env);
}
