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
var pink = __toESM(require("pink"));
var vscode = __toESM(require("vscode"));
var path = __toESM(require("node:path"));
function currentLang() {
  let locale = "en";
  try {
    const cfg = process.env.VSCODE_NLS_CONFIG;
    if (cfg) {
      locale = JSON.parse(cfg).locale || locale;
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
  return text.replace(/%?\{(\w+)\}/g, (match, key) => key in sub ? String(sub[key]) : match);
}
function runtimeRequire(request) {
  try {
    return module.require(request);
  } catch {
    return void 0;
  }
}
async function createQRCodeSrc(url) {
  if (!url) {
    return "";
  }
  try {
    const qrcode = runtimeRequire("qrcode");
    if (qrcode?.toDataURL) {
      return await qrcode.toDataURL(url, {
        errorCorrectionLevel: "H",
        maskPattern: 2,
        margin: 1,
        width: 180
      });
    }
  } catch {
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(url)}`;
}
async function getPreviewInfo(request = {}) {
  const buildPath = request.buildPath || "project://build";
  const outputName = request.outputName || "web-mobile";
  const platform = "web-mobile";
  const previewUrl = await pink.builder.getPreviewUrl(buildPath + "/" + outputName, platform) || "";
  const webGPUTips = request.useWebGPU && previewUrl && !previewUrl.startsWith("https") ? lookup(loadBundle(), "tips.webGPUServer") || "" : "";
  return {
    previewUrl,
    qrcodeSrc: webGPUTips ? "" : await createQRCodeSrc(previewUrl),
    webGPUTips,
    webGPULink: "https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts"
  };
}
function activate(context) {
  context.registerMethod("getI18nBundle", () => loadBundle());
  context.registerMethod("t", (key, sub) => {
    const text = lookup(loadBundle(), key);
    return text === void 0 ? key : substitute(text, sub);
  });
  context.registerMethod("getPreviewInfo", (request) => getPreviewInfo(request));
  context.registerMethod("openPreviewUrl", async (url) => {
    if (url) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
