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
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var pink = __toESM(require("pink"));
var vscode = __toESM(require("vscode"));
var BASE_URLS = {
  dev: "https://dev-agent-api.s00.tech",
  fat: "https://fat-agent-api.s00.tech",
  prod: "https://cn-000-agent-api.s01.tech"
};
var PRIVATE_KEY_CACHE_DIR = "package-private-keys";
var gameList = [];
function currentLang() {
  let locale = "en";
  try {
    const config = process.env.VSCODE_NLS_CONFIG;
    if (config) {
      locale = JSON.parse(config).locale || locale;
    }
  } catch {
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
async function resolveEnv() {
  try {
    const config = await pink.baseConfig.getConfig();
    return normalizeEnv(config?.env) || "prod";
  } catch {
    return "prod";
  }
}
async function resolveOpenPaaSPortal() {
  try {
    const config = await pink.baseConfig.getConfig();
    return config?.web?.openpaasPortal;
  } catch {
    return "";
  }
}
async function readAccessToken() {
  const session = await vscode.authentication.getSession("pink", [], { createIfNone: true });
  if (!session?.accessToken) {
    throw new Error("No Pink authentication session found");
  }
  console.log(`[web-publish]11 readAccessToken`, session.accessToken);
  return session.accessToken;
}
function normalizeString(value) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  const normalized = String(value).trim();
  return normalized || void 0;
}
function normalizeCodeVersion(value) {
  return normalizeString(value);
}
function normalizeGameName(value) {
  const name = String(value || "").trim();
  return name || "Cocos Game";
}
function getContextGameInfo(context) {
  const gameInfo = context?.game_info;
  return gameInfo && typeof gameInfo === "object" && !Array.isArray(gameInfo) ? gameInfo : {};
}
function resolvePackagePrivateKey(data) {
  return normalizeString(data.package_private_key) ?? normalizeString(getContextGameInfo(data.context).package_private_key);
}
function savePackagePrivateKeyFile(gameId, data) {
  const packagePrivateKey = resolvePackagePrivateKey(data);
  if (!packagePrivateKey) {
    throw new Error("OpenPaaS package context response is missing package_private_key");
  }
  const keyPath = resolvePackagePrivateKeyFilePath(gameId, data, packagePrivateKey);
  (0, import_node_fs.mkdirSync)(path.dirname(keyPath), { recursive: true });
  (0, import_node_fs.writeFileSync)(keyPath, packagePrivateKey.replace(/^\uFEFF/, ""), "utf8");
  try {
    (0, import_node_fs.chmodSync)(keyPath, 384);
  } catch {
  }
  return keyPath;
}
function resolvePackagePrivateKeyFilePath(gameId, data, packagePrivateKey) {
  const normalizedGameId = sanitizeFileNameSegment(gameId, "game");
  const packageId = sanitizeFileNameSegment(data.package_id, "package");
  const codeVersion = sanitizeFileNameSegment(normalizeCodeVersion(getContextGameInfo(data.context).code_version), "version");
  const keyHash = (0, import_node_crypto.createHash)("sha256").update(packagePrivateKey).digest("hex").slice(0, 12);
  return path.join(__dirname, "..", "..", "tools", PRIVATE_KEY_CACHE_DIR, normalizedGameId, `${packageId}_${codeVersion}_${keyHash}.key`);
}
function sanitizeFileNameSegment(value, fallback) {
  return (normalizeString(value) || fallback).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 80) || fallback;
}
var LAST_APPID_FILE = path.join(__dirname, "..", "..", "tools", PRIVATE_KEY_CACHE_DIR, "last-appid.json");
function readLastCreatedAppId() {
  try {
    const content = (0, import_node_fs.readFileSync)(LAST_APPID_FILE, "utf8").replace(/^﻿/, "");
    const parsed = JSON.parse(content);
    return String(parsed.appid || "").trim();
  } catch {
    return "";
  }
}
function resolvePackageContextPackagesInfo(request = {}) {
  const subPackageNames = Array.isArray(request.subPackageNames) ? request.subPackageNames.map((name) => String(name || "").trim()).filter(Boolean) : [];
  return {
    subPackages: subPackageNames.map((name) => ({ name }))
  };
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
  const resolvedEnv = await resolveEnv();
  const accessToken = await readAccessToken();
  const url = `${BASE_URLS[resolvedEnv]}${apiPath}`;
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
    throw new Error(`OpenPaaS request failed: ${apiPath}, env=${resolvedEnv}, reason=${errorMessage(error)}`);
  }
  if (!response.ok) {
    const responseBody2 = await readResponseBody(response);
    throw new Error(`OpenPaaS request failed: ${apiPath}, env=${resolvedEnv}, HTTP ${response.status}${responseBody2 ? `, body=${responseBody2.slice(0, 1e3)}` : ""}`);
  }
  const responseBody = await readResponseBody(response);
  let result;
  try {
    result = JSON.parse(responseBody);
  } catch (error) {
    throw new Error(`OpenPaaS response is not valid JSON: ${apiPath}, env=${resolvedEnv}, reason=${errorMessage(error)}${responseBody ? `, body=${responseBody.slice(0, 1e3)}` : ""}`);
  }
  if (result.ret_code !== 0) {
    throw new Error(`OpenPaaS API error: ${apiPath}, env=${resolvedEnv}, code=${result.ret_code}, message=${result.ret_msg}`);
  }
  return { data: result.data, accessToken, uploadEnv: resolvedEnv };
}
async function getOpenPaasGameList() {
  const { data, accessToken, uploadEnv } = await postOpenPaas("/api/game/list", {
    page_no: 1,
    page_size: 100
  });
  ;
  gameList.length = 0;
  const games = (data.records || []).map((game) => {
    const codeVersion = normalizeCodeVersion(game.code_version);
    gameList.push(game.game_id);
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
async function getOpenPaasPackageContext(gameId, request = {}) {
  const normalizedGameId = String(gameId || "").trim();
  if (!normalizedGameId) {
    throw new Error("Missing OpenPaaS game id");
  }
  const packagesInfo = resolvePackageContextPackagesInfo(request);
  const subPackageNames = packagesInfo.subPackages.map((subpackage) => subpackage.name);
  const { data, accessToken, uploadEnv } = await postOpenPaas("/api/game/package/context", {
    game_id: normalizedGameId,
    include_sp_package: packagesInfo.subPackages.length > 0,
    include_web_package: !!request.includeWebPackage,
    sub_package_names: subPackageNames,
    generate_new_package_key: true
  });
  const codeVersion = normalizeCodeVersion(getContextGameInfo(data.context).code_version);
  const privatePemPath = savePackagePrivateKeyFile(normalizedGameId, data);
  const { package_private_key: _packagePrivateKey, ...safeData } = data;
  return {
    ...safeData,
    gameId: normalizedGameId,
    privatePemPath,
    accessToken,
    uploadEnv,
    codeVersion
  };
}
async function createOpenPaasGame(request = {}) {
  const gameName = normalizeGameName(request.name);
  const { data, accessToken, uploadEnv } = await postOpenPaas("/api/game/create", {
    name: gameName,
    engine: "pink"
  });
  const gameId = String(data.game_id || "").trim();
  if (!gameId) {
    throw new Error("OpenPaaS create game response is incomplete");
  }
  const packageContext = await getOpenPaasPackageContext(gameId, request);
  return {
    ...packageContext,
    gameId,
    gameName,
    accessToken,
    uploadEnv
  };
}
function activate(context) {
  context.registerPreBuildHook?.(async () => {
    const accessToken = await readAccessToken();
    const uploadEnv = await resolveEnv();
    return {
      packages: {
        openpaas: {
          accessToken,
          uploadEnv
        }
      }
    };
  });
  context.registerPostStageHook?.(async (params) => {
    if (params.stageName !== "publish") {
      return;
    }
    await getOpenPaasGameList();
    const openpaasPortal = await resolveOpenPaaSPortal();
    const appid = params.task.options.packages["openpaas"].appid;
    if (gameList.indexOf(appid) > -1) {
      const url = `${openpaasPortal}/${params.task.options.packages["openpaas"].appid}/version`;
      console.log(`[web-publish]11 OpenPaaS portal: ${url}`);
      await vscode.commands.executeCommand("pink.builder.openPortal", { url, title: "\u5BA1\u6838\u4EFB\u52A1", params: { pluginId: "openpaas", entry: "review", taskId: params.taskId } });
    } else {
      console.warn(`\u672A\u6784\u5EFA\u63D0\u4EA4\u4EFB\u4F55\u6E38\u620F\uFF0C\u65E0\u6CD5\u6253\u5F00\u5BA1\u6838\u8BE6\u60C5\u9875`);
      return;
    }
  });
  context.registerMethod("getI18nBundle", () => loadBundle());
  context.registerMethod("t", (key, sub) => {
    const text = lookup(loadBundle(), key);
    return text === void 0 ? key : substitute(text, sub);
  });
  context.registerMethod("getOpenPaasGameList", () => getOpenPaasGameList());
  context.registerMethod("getOpenPaasPackageContext", (gameId, request) => getOpenPaasPackageContext(gameId, request));
  context.registerMethod("createOpenPaasGame", (request) => createOpenPaasGame(request));
  context.registerMethod("getLastCreatedAppId", () => readLastCreatedAppId());
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
