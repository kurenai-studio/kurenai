import { describe, expect, it } from "vitest";
import { resolveCredentials, UPLOAD_BASE_URLS } from "../src/credentials.js";

describe("OpenPaaS credentials", () => {
  it("prefers an explicit token and environment over the environment variables", () => {
    const creds = resolveCredentials(
      { accessToken: "from-option", uploadEnv: "dev" },
      { OPENPAAS_ACCESS_TOKEN: "from-env", OPENPAAS_UPLOAD_ENV: "prod" },
    );
    expect(creds).toEqual({
      accessToken: "from-option",
      uploadEnv: "dev",
      baseUrl: UPLOAD_BASE_URLS.dev,
    });
  });

  it("falls back from OPENPAAS_ACCESS_TOKEN to SUD_ACCESS_TOKEN and defaults to prod", () => {
    expect(resolveCredentials({}, { SUD_ACCESS_TOKEN: "sud" })).toEqual({
      accessToken: "sud",
      uploadEnv: "prod",
      baseUrl: UPLOAD_BASE_URLS.prod,
    });
    expect(resolveCredentials({}, { OPENPAAS_ACCESS_TOKEN: "pink", SUD_UPLOAD_ENV: "fat" }).uploadEnv).toBe("fat");
  });

  it("uses OPENPAAS_UPLOAD_BASE_URL and strips a trailing slash", () => {
    const creds = resolveCredentials(
      {},
      { OPENPAAS_ACCESS_TOKEN: "pink", OPENPAAS_UPLOAD_BASE_URL: "https://example.test/api/" },
    );
    expect(creds.baseUrl).toBe("https://example.test/api");
    expect(creds.uploadEnv).toBe("prod");
  });

  it("refuses to start when no token is set", () => {
    expect(() => resolveCredentials({}, {})).toThrow(/Missing OpenPaaS access token/);
  });
});
