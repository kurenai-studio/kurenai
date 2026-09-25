// src/view/build-config.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { TypedField } from "@pink/ui-kit";
import { jsx, jsxs } from "react/jsx-runtime";
var INPUT = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 26,
  padding: "0 8px",
  border: "1px solid var(--vscode-input-border, transparent)",
  color: "var(--vscode-input-foreground)",
  background: "var(--vscode-input-background)",
  outline: "none"
};
var SELECT = {
  ...INPUT,
  padding: "0 6px"
};
var ACTION_ROW = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center"
};
var BUTTON = {
  height: 26,
  padding: "0 10px",
  border: "1px solid var(--vscode-button-border, transparent)",
  color: "var(--vscode-button-foreground)",
  background: "var(--vscode-button-background)",
  cursor: "pointer"
};
var INFO = {
  paddingTop: 3,
  fontSize: 11,
  lineHeight: "16px",
  color: "var(--vscode-descriptionForeground)"
};
var ERROR = {
  paddingTop: 3,
  fontSize: 11,
  lineHeight: "16px",
  color: "var(--vscode-errorForeground, #f14c4c)"
};
var OPENPAAS_HIDDEN_SCHEMA_FIELDS = `
[data-option-key="packages.web-desktop.versionName"] {
    display: none !important;
}
`;
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
function stringValue(value) {
  return typeof value === "string" ? value : value === void 0 || value === null ? "" : String(value);
}
function WebDesktopBuildView({ value, onChange, bridge, commonValue }) {
  const [bundle, setBundle] = useState({});
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [contextReady, setContextReady] = useState(false);
  const syncedAppIdRef = useRef("");
  const t = (key) => translate(bundle, key);
  const set = (key, next) => onChange([key], next);
  const currentAppId = stringValue(value.appid);
  const isOpenPaasHostPlatform = stringValue(commonValue?.platform) === "openpaas";
  useEffect(() => {
    if (!bridge) {
      return;
    }
    let cancelled = false;
    bridge.invoke("getI18nBundle").then((data) => {
      if (!cancelled) {
        setBundle(data ?? {});
      }
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [bridge]);
  useEffect(() => {
    if (!bridge) {
      return;
    }
    let cancelled = false;
    bridge.invoke("getOpenPaasWebPackageBridge").then((payload) => {
      if (cancelled) {
        return;
      }
      if (payload.bridgeLink !== void 0) {
        set("bridgeLink", payload.bridgeLink);
      }
      if (payload.accessToken !== void 0) {
        set("accessToken", payload.accessToken);
      }
      if (payload.uploadEnv) {
        set("uploadEnv", payload.uploadEnv);
      }
    }).catch((error) => {
      if (!cancelled) {
        setServiceError(error instanceof Error ? error.message : String(error));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bridge]);
  const loadGames = useCallback(async () => {
    if (!bridge || isOpenPaasHostPlatform) {
      return;
    }
    setLoadingGames(true);
    setServiceError("");
    try {
      const result = await bridge.invoke("getOpenPaasGameList");
      const nextGames = Array.isArray(result) ? result : result.games;
      const accessToken = Array.isArray(result) ? void 0 : result.accessToken;
      const uploadEnv = Array.isArray(result) ? void 0 : result.uploadEnv;
      setGames(Array.isArray(nextGames) ? nextGames : []);
      if (accessToken !== void 0) {
        set("accessToken", accessToken);
      }
      if (uploadEnv) {
        set("uploadEnv", uploadEnv);
      }
    } catch (error) {
      setGames([]);
      setServiceError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingGames(false);
    }
  }, [bridge, isOpenPaasHostPlatform]);
  useEffect(() => {
    void loadGames();
  }, [loadGames]);
  const fetchPackageContext = async (gameId = currentAppId) => {
    if (!bridge || !gameId || isOpenPaasHostPlatform) {
      return;
    }
    setLoadingContext(true);
    setServiceError("");
    setContextReady(false);
    try {
      const payload = await bridge.invoke("getOpenPaasPackageContext", gameId);
      set("accessToken", payload.accessToken || "");
      if (payload.uploadEnv) {
        set("uploadEnv", payload.uploadEnv);
      }
      set("codeVersion", payload.codeVersion || stringValue(value.codeVersion));
      setContextReady(true);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingContext(false);
    }
  };
  useEffect(() => {
    if (!bridge || !currentAppId || isOpenPaasHostPlatform) {
      syncedAppIdRef.current = "";
      return;
    }
    if (syncedAppIdRef.current === currentAppId) {
      return;
    }
    syncedAppIdRef.current = currentAppId;
    void fetchPackageContext(currentAppId);
  }, [bridge, currentAppId, isOpenPaasHostPlatform]);
  const applyGame = (gameId) => {
    syncedAppIdRef.current = gameId;
    setContextReady(false);
    set("appid", gameId);
    set("accessToken", "");
    const game = games.find((item) => item.id === gameId);
    set("codeVersion", game?.codeVersion || "");
    if (gameId) {
      void fetchPackageContext(gameId);
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { width: "100%", minWidth: 0, boxSizing: "border-box" }, children: [
    isOpenPaasHostPlatform && /* @__PURE__ */ jsx("style", { children: OPENPAAS_HIDDEN_SCHEMA_FIELDS }),
    !isOpenPaasHostPlatform && /* @__PURE__ */ jsxs("div", { className: "pk-field-row", "data-option-key": "packages.web-desktop.appid", children: [
      /* @__PURE__ */ jsxs(TypedField, { label: t("service.game"), tooltip: t("service.game_hint"), children: [
        /* @__PURE__ */ jsxs("div", { style: ACTION_ROW, children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              style: SELECT,
              value: currentAppId,
              disabled: loadingGames,
              onChange: (event) => applyGame(event.target.value),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: loadingGames ? t("service.loading_games") : t("service.game_placeholder") }),
                games.map((game) => /* @__PURE__ */ jsx("option", { value: game.id, children: game.label }, game.id))
              ]
            }
          ),
          /* @__PURE__ */ jsx("button", { style: BUTTON, type: "button", disabled: loadingGames, onClick: () => void loadGames(), children: t("service.refresh_games") })
        ] }),
        !loadingGames && games.length === 0 && /* @__PURE__ */ jsx("div", { style: INFO, children: t("service.no_games") })
      ] }),
      /* @__PURE__ */ jsx("div", { style: INFO, children: loadingContext ? t("service.loading_context") : contextReady ? t("service.context_ready") : stringValue(value.codeVersion) ? t("service.code_version").replace("{codeVersion}", stringValue(value.codeVersion)) : "" }),
      serviceError && /* @__PURE__ */ jsx("div", { style: ERROR, children: serviceError })
    ] })
  ] });
}
export {
  WebDesktopBuildView as default
};
