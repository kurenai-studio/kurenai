// src/view/build-config.tsx
import { useState, useEffect } from "react";
import { TypedField, Checkbox } from "@pink/ui-kit";
import { jsx, jsxs } from "react/jsx-runtime";
var HIGH_PERF_DOC = "https://developers.weixin.qq.com/minigame/dev/guide/performance/perf-high-performance.html";
var WARN = { padding: "2px 0 4px 0", fontSize: 11, lineHeight: "16px", color: "var(--vscode-editorWarning-foreground, #cca700)" };
var MSG = { padding: "2px 0 4px 0", fontSize: 11, lineHeight: "16px", opacity: 0.75 };
var LINK = { color: "var(--vscode-textLink-foreground)", textDecoration: "underline", cursor: "pointer" };
function translate(bundle, key) {
  let cur = bundle;
  for (const seg of key.split(".")) {
    if (cur && typeof cur === "object" && seg in cur) {
      cur = cur[seg];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}
function WechatGameBuildView({ value, onChange, bridge, commonValue }) {
  const [bundle, setBundle] = useState({});
  const [version, setVersion] = useState("");
  useEffect(() => {
    if (!bridge) {
      return;
    }
    let cancelled = false;
    bridge.invoke("getI18nBundle").then((b) => {
      if (!cancelled) {
        setBundle(b ?? {});
      }
    }).catch(() => {
    });
    bridge.invoke("getEngineInfo").then((i) => {
      if (!cancelled) {
        setVersion(i?.version ?? "");
      }
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [bridge]);
  const t = (key) => translate(bundle, key);
  const bool = (k) => !!value?.[k];
  const set = (k, v) => onChange([k], v);
  const isReleaseVersion = !version || /^\d+\.\d+\.\d+$/.test(version);
  const separateEngine = bool("separateEngine");
  const nativeMode = String(commonValue?.nativeCodeBundleMode ?? "");
  const wasmCompress = commonValue?.wasmCompressionMode;
  const separateEngineWarn = separateEngine && (nativeMode !== "wasm" || !!wasmCompress) ? t("tips.separate_engine_with_wasm") : "";
  const separateEngineTip = separateEngineWarn || (isReleaseVersion ? t("options.separate_engine_tips") : t("tips.separate_engine_only_in_normal_version"));
  return (
    // 不自带 TypedFieldResizeProvider:由 PinK 宿主整页提供,与 common/平台字段共享列宽。
    // 每个配置项行用 PinK 契约的 `pk-field-row`(行距/控件高度/列宽与内置字段一致,缩进交给宿主 pk-section-body),
    // 并标注 data-option-key(相对构建 options 的绝对索引 key,即 packages.wechatgame.<field>):
    // PinK 宿主会委托处理右键「复制 key」(读取最近的 data-option-key 元素并复制),自定义视图无需自实现。
    // dev 模式下宿主会扫描本视图,pk-field-row 缺 data-option-key 会在控制台告警。
    /* @__PURE__ */ jsxs("div", { style: { width: "100%", minWidth: 0, boxSizing: "border-box" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "pk-field-row", "data-option-key": "packages.wechatgame.separateEngine", children: [
        /* @__PURE__ */ jsx(TypedField, { label: t("options.separate_engine"), tooltip: separateEngineTip, children: /* @__PURE__ */ jsx(Checkbox, { checked: separateEngine, disabled: !isReleaseVersion, onCheckedChange: (c) => set("separateEngine", !!c) }) }),
        separateEngineWarn && /* @__PURE__ */ jsx("div", { style: WARN, children: separateEngineWarn }),
        !isReleaseVersion && /* @__PURE__ */ jsx("div", { style: MSG, children: t("tips.separate_engine_only_in_normal_version") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pk-field-row", "data-option-key": "packages.wechatgame.highPerformanceMode", children: [
        /* @__PURE__ */ jsx(TypedField, { label: t("options.highPerformanceMode"), children: /* @__PURE__ */ jsx(Checkbox, { checked: bool("highPerformanceMode"), onCheckedChange: (c) => set("highPerformanceMode", !!c) }) }),
        bool("highPerformanceMode") && /* @__PURE__ */ jsxs("div", { style: MSG, children: [
          t("tips.pleaseRead"),
          " ",
          /* @__PURE__ */ jsx("span", { style: LINK, onClick: () => {
            void bridge?.invoke("openExternal", HIGH_PERF_DOC);
          }, children: t("tips.weixinDocs") }),
          " ",
          t("tips.enableHighPerformanceMode")
        ] })
      ] })
    ] })
  );
}
export {
  WechatGameBuildView as default
};
