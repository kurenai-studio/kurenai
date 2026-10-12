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
var hostLocale;
function currentLang() {
  let locale = "en";
  if (hostLocale) {
    locale = hostLocale;
  } else {
    try {
      const cfg = process.env.VSCODE_NLS_CONFIG;
      if (cfg) {
        const parsed = JSON.parse(cfg);
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
  let cur = bundle;
  for (const seg of key.split(".")) {
    if (cur && typeof cur === "object" && seg in cur) {
      cur = cur[seg];
    } else {
      return void 0;
    }
  }
  return typeof cur === "string" ? cur : void 0;
}
function substitute(text, sub) {
  if (!sub) {
    return text;
  }
  return text.replace(/%?\{(\w+)\}/g, (m, k) => k in sub ? String(sub[k]) : m);
}
function activate(context) {
  if (context.locale) {
    hostLocale = context.locale;
    cache = void 0;
  }
  context.registerMethod("getI18nBundle", () => loadBundle());
  context.registerMethod("t", (key, sub) => {
    const text = lookup(loadBundle(), key);
    return text === void 0 ? key : substitute(text, sub);
  });
  context.registerPreStageHook?.(async (options, ctx) => {
    const pkg = options.packages?.wechatgame;
    if (pkg?.wechatToolsPath) {
      console.log("[wechatgame:preStageHook] options \u5DF2\u5E26 wechatToolsPath,\u4E0D\u8986\u76D6:", pkg.wechatToolsPath);
      return;
    }
    const wechatToolsPath = await ctx.getConfig("programManager.wechatDevTools");
    console.log("[wechatgame:preStageHook] \u8BFB\u53D6 programManager.wechatDevTools =", JSON.stringify(wechatToolsPath));
    if (wechatToolsPath) {
      return { packages: { wechatgame: { wechatToolsPath } } };
    }
    return;
  });
  context.registerSchemaPatcher?.(() => ({
    platformOptions: {
      properties: {
        wechatToolsPath: {
          editPresentation: "filepath",
          editPresentationOptions: {
            placeholder: "Select WeChat DevTools cli executable",
            // Windows: cli.bat;macOS: cli(无扩展名,filters 不限定即可显示)
            filters: { Executables: ["bat", "exe"] }
          }
        }
      }
    }
  }));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
