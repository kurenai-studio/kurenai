"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/view/build-config-host.ts
var build_config_host_exports = {};
__export(build_config_host_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(build_config_host_exports);
var path = __toESM(require("node:path"));
var pink = __toESM(require("pink"));
var vscode = __toESM(require("vscode"));
var PLATFORM = "web-desktop";
var BRIDGE_API_PATH = "/api/game/web/package/bridge";
var hostLocale;
function currentLang() {
  let locale = "en";
  if (hostLocale) {
    locale = hostLocale;
  } else {
    try {
      const config = process.env.VSCODE_NLS_CONFIG;
      if (config) {
        const parsed = JSON.parse(config);
        locale = parsed.resolvedLanguage || parsed.locale || locale;
      }
    } catch {
    }
  }
  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}
var cache;
function loadBundle() {
  const lang = currentLang();
  if (cache?.lang === lang) {
    return cache.bundle;
  }
  let bundle = {};
  try {
    const file = path.join(__dirname, "..", "..", "i18n", `${lang}.js`);
    delete require.cache[require.resolve(file)];
    bundle = require(file) ?? {};
  } catch {
    bundle = {};
  }
  cache = { lang, bundle };
  return bundle;
}
function lookup(bundle, key) {
  let current = bundle;
  for (const segment of key.split(".")) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return void 0;
    }
  }
  return typeof current === "string" ? current : void 0;
}
function substitute(text, sub) {
  if (!sub) {
    return text;
  }
  return text.replace(/%?\{(\w+)\}/g, (match, key) => key in sub ? String(sub[key]) : match);
}
function normalizeEnv(env) {
  return env === "dev" || env === "fat" || env === "prod" ? env : void 0;
}
async function resolveOpenPaasEndpoint() {
  try {
    const config = await pink.baseConfig.getConfig();
    const apiBaseUrl = String(config?.api?.api || "").trim().replace(/\/+$/, "");
    if (!apiBaseUrl) {
      throw new Error("baseConfig.api.api is empty");
    }
    return {
      apiBaseUrl,
      uploadEnv: normalizeEnv(config?.env) || "prod"
    };
  } catch (error) {
    throw new Error(`Failed to resolve OpenPaaS API base URL from pink.baseConfig.getConfig(): ${errorMessage(error)}`);
  }
}
async function readAccessToken() {
  const envToken = String(process.env.OPENPAAS_ACCESS_TOKEN || process.env.SUD_ACCESS_TOKEN || "").trim();
  if (envToken) {
    return envToken;
  }
  const session = await vscode.authentication.getSession("pink", [], { createIfNone: true });
  if (!session?.accessToken) {
    throw new Error("No Pink authentication session found");
  }
  return session.accessToken;
}
function normalizeCodeVersion(value) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  const normalized = String(value).trim();
  return normalized || void 0;
}
function errorMessage(error) {
  if (error instanceof Error) {
    return error.message || error.stack || String(error);
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
async function readResponseBody(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
async function postOpenPaas(apiPath, body) {
  const { apiBaseUrl, uploadEnv } = await resolveOpenPaasEndpoint();
  const accessToken = await readAccessToken();
  const url = `${apiBaseUrl}${apiPath}`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sud-at": accessToken,
        "x-sud-encrypt-request": "true"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(`OpenPaaS request failed: ${apiPath}, env=${uploadEnv}, reason=${errorMessage(error)}`);
  }
  if (!response.ok) {
    const responseBody2 = await readResponseBody(response);
    throw new Error(`OpenPaaS request failed: ${apiPath}, env=${uploadEnv}, HTTP ${response.status}${responseBody2 ? `, body=${responseBody2.slice(0, 1e3)}` : ""}`);
  }
  const responseBody = await readResponseBody(response);
  let result;
  try {
    result = JSON.parse(responseBody);
  } catch (error) {
    throw new Error(`OpenPaaS response is not valid JSON: ${apiPath}, env=${uploadEnv}, reason=${errorMessage(error)}${responseBody ? `, body=${responseBody.slice(0, 1e3)}` : ""}`);
  }
  if (result.ret_code !== 0) {
    throw new Error(`OpenPaaS API error: ${apiPath}, env=${uploadEnv}, code=${result.ret_code}, message=${result.ret_msg}`);
  }
  return { data: result.data, accessToken, uploadEnv };
}
async function getOpenPaasWebPackageBridge(accessToken, endpoint) {
  const { apiBaseUrl, uploadEnv } = endpoint;
  const url = `${apiBaseUrl}${BRIDGE_API_PATH}`;
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "x-sud-at": accessToken,
        "x-sud-encrypt-request": "true"
      }
    });
  } catch (error) {
    throw new Error(`OpenPaaS request failed: ${BRIDGE_API_PATH}, env=${uploadEnv}, reason=${errorMessage(error)}`);
  }
  if (!response.ok) {
    const responseBody2 = await readResponseBody(response);
    throw new Error(`OpenPaaS request failed: ${BRIDGE_API_PATH}, env=${uploadEnv}, HTTP ${response.status}${responseBody2 ? `, body=${responseBody2.slice(0, 1e3)}` : ""}`);
  }
  const responseBody = await readResponseBody(response);
  let result;
  try {
    result = JSON.parse(responseBody);
  } catch (error) {
    throw new Error(`OpenPaaS response is not valid JSON: ${BRIDGE_API_PATH}, env=${uploadEnv}, reason=${errorMessage(error)}${responseBody ? `, body=${responseBody.slice(0, 1e3)}` : ""}`);
  }
  if (result.ret_code !== 0) {
    throw new Error(`OpenPaaS API error: ${BRIDGE_API_PATH}, env=${uploadEnv}, code=${result.ret_code}, message=${result.ret_msg}`);
  }
  const link = String(result.data?.link || "").trim();
  if (!link) {
    throw new Error(`OpenPaaS API error: ${BRIDGE_API_PATH}, env=${uploadEnv}, bridge link is empty`);
  }
  return link;
}
async function resolveOpenPaasWebPackageBridge() {
  const accessToken = await readAccessToken();
  const endpoint = await resolveOpenPaasEndpoint();
  const bridgeLink = await getOpenPaasWebPackageBridge(accessToken, endpoint);
  return {
    bridgeLink,
    accessToken,
    uploadEnv: endpoint.uploadEnv
  };
}
async function getOpenPaasGameList() {
  const { data, accessToken, uploadEnv } = await postOpenPaas("/api/game/list", {
    page_no: 1,
    page_size: 100
  });
  const games = (data.records || []).map((game) => {
    const codeVersion = normalizeCodeVersion(game.code_version);
    return {
      id: String(game.game_id || "").trim(),
      name: String(game.game_name || "").trim(),
      icon: typeof game.game_icon === "string" ? game.game_icon : "",
      codeVersion,
      label: `${game.game_id}${game.game_name ? ` (${game.game_name})` : ""}`
    };
  }).filter((game) => game.id);
  return {
    games,
    accessToken,
    uploadEnv
  };
}
async function getOpenPaasPackageContext(gameId) {
  const normalizedGameId = String(gameId || "").trim();
  if (!normalizedGameId) {
    throw new Error("Missing OpenPaaS game id");
  }
  const { data, accessToken, uploadEnv } = await postOpenPaas("/api/game/package/context", {
    game_id: normalizedGameId
  });
  const codeVersion = normalizeCodeVersion(data.context?.game_info?.code_version);
  return {
    ...data,
    accessToken,
    uploadEnv,
    codeVersion
  };
}
function activate(context) {
  if (context.locale) {
    hostLocale = context.locale;
    cache = void 0;
  }
  context.registerPreBuildHook?.(async () => {
    const { accessToken, uploadEnv, bridgeLink } = await resolveOpenPaasWebPackageBridge();
    return {
      packages: {
        [PLATFORM]: {
          accessToken,
          uploadEnv,
          bridgeLink
        }
      }
    };
  });
  context.registerMethod("getI18nBundle", () => loadBundle());
  context.registerMethod("t", (key, sub) => {
    const text = lookup(loadBundle(), key);
    return text === void 0 ? key : substitute(text, sub);
  });
  context.registerMethod("getOpenPaasGameList", () => getOpenPaasGameList());
  context.registerMethod("getOpenPaasPackageContext", (gameId) => getOpenPaasPackageContext(gameId));
  context.registerMethod("getOpenPaasWebPackageBridge", () => resolveOpenPaasWebPackageBridge());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
