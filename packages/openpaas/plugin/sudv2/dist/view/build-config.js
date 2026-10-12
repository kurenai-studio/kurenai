// src/view/build-config.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { PinkIcon, TypedField } from "@pink/ui-kit";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var LEGACY_DEFAULT_ENCRYPT_KEY = "00112233445566778899aabbccddeeff";
var CREATE_GAME_OPTION_VALUE = "__create_game__";
var MAX_GAME_COUNT = 100;
var ROW = { padding: "2px 16px 6px 0px" };
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
var ERROR = {
  padding: "3px 0 0 0",
  fontSize: 11,
  lineHeight: "16px",
  color: "var(--vscode-errorForeground, #f14c4c)"
};
var INFO = {
  padding: "3px 0 0 0",
  fontSize: 11,
  lineHeight: "16px",
  color: "var(--vscode-descriptionForeground)"
};
var GROUP_HEADER = {
  display: "flex",
  alignItems: "center",
  minHeight: 26,
  gap: 6,
  cursor: "pointer",
  userSelect: "none"
};
var GROUP_ARROW = {
  width: 12,
  height: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};
var GROUP_CONTENT = {
  paddingTop: 6
};
var HIDDEN_SCHEMA_FIELDS = `
[data-option-key="packages.openpaas.privatePemPath"],
[data-option-key="packages.openpaas.encryptKey"] {
    display: none !important;
}
`;
var NETWORK_TIMEOUT_FIELDS = [{
  key: "XMLHttpRequest",
  label: "options.network_timeout_xml_http_request",
  tooltip: "options.network_timeout_xml_http_request_hint"
}, {
  key: "Websocket",
  label: "options.network_timeout_websocket",
  tooltip: "options.network_timeout_websocket_hint"
}, {
  key: "uploadFile",
  label: "options.network_timeout_upload_file",
  tooltip: "options.network_timeout_upload_file_hint"
}, {
  key: "downloadFile",
  label: "options.network_timeout_download_file",
  tooltip: "options.network_timeout_download_file_hint"
}];
var DEFAULT_NETWORK_TIMEOUT = {
  XMLHttpRequest: "6000",
  Websocket: "6000",
  uploadFile: "6000",
  downloadFile: "6000"
};
function translate(bundle, key) {
  let current = bundle;
  for (const segment of key.split(".")) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}
function formatMessage(text, sub) {
  if (!sub) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (match, key) => key in sub ? String(sub[key]) : match);
}
function stringValue(value) {
  return typeof value === "string" ? value : value === void 0 || value === null ? "" : String(value);
}
function boolValue(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function networkTimeoutValue(value) {
  if (typeof value === "string" && value.trim()) {
    return {
      XMLHttpRequest: value,
      Websocket: value,
      uploadFile: value,
      downloadFile: value
    };
  }
  return objectValue(value);
}
function generateRandomSecret(length = 16) {
  const randomArr = new Uint8Array(length);
  globalThis.crypto.getRandomValues(randomArr);
  let secret = "";
  for (let i = 0; i < randomArr.length; i++) {
    secret += randomArr[i].toString(16).padStart(2, "0");
  }
  return secret;
}
function shouldGenerateEncryptKey(value) {
  const normalized = value.trim();
  return normalized === "" || normalized === LEGACY_DEFAULT_ENCRYPT_KEY;
}
function TextField({
  label,
  tooltip,
  value,
  onChange
}) {
  const current = typeof value === "string" ? value : "";
  return /* @__PURE__ */ jsx("div", { style: ROW, children: /* @__PURE__ */ jsx(TypedField, { label, tooltip, children: /* @__PURE__ */ jsx(
    "input",
    {
      style: INPUT,
      value: current,
      onChange: (event) => onChange(event.target.value)
    }
  ) }) });
}
function NetworkTimeoutField({
  label,
  tooltip,
  value,
  translate: translate2,
  onChange
}) {
  const [expanded, setExpanded] = useState(false);
  const current = {
    ...DEFAULT_NETWORK_TIMEOUT,
    ...networkTimeoutValue(value)
  };
  const setField = (key, next) => {
    onChange({
      ...current,
      [key]: next
    });
  };
  return /* @__PURE__ */ jsxs("div", { style: ROW, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: GROUP_HEADER,
        role: "button",
        tabIndex: 0,
        title: tooltip,
        onClick: () => setExpanded((next) => !next),
        onKeyDown: (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((next) => !next);
          }
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: GROUP_ARROW, children: /* @__PURE__ */ jsx(PinkIcon, { name: expanded ? "chevron-down" : "chevron-right" }) }),
          /* @__PURE__ */ jsx("span", { children: label })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsx("div", { style: GROUP_CONTENT, children: NETWORK_TIMEOUT_FIELDS.map((field) => /* @__PURE__ */ jsx(
      TextField,
      {
        label: translate2(field.label),
        tooltip: translate2(field.tooltip),
        value: current[field.key],
        onChange: (next) => setField(field.key, next)
      },
      field.key
    )) })
  ] });
}
function SudV2BuildView({ value, onChange, bridge, commonValue }) {
  const [bundle, setBundle] = useState({});
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [contextReady, setContextReady] = useState(false);
  const syncedAppIdRef = useRef("");
  const applyGameRef = useRef(() => {
  });
  const appIdRef = useRef("");
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
  const t = (key, sub) => formatMessage(translate(bundle, key), sub);
  const set = (key, next) => onChange([key], next);
  const currentAppId = stringValue(value.appid);
  appIdRef.current = currentAppId;
  const currentEncryptKey = stringValue(value.encryptKey);
  const includeWebPackage = boolValue(value.enableWebBuild);
  const gameName = stringValue(commonValue?.name) || stringValue(commonValue?.taskName) || "Cocos Game";
  useEffect(() => {
    if (shouldGenerateEncryptKey(currentEncryptKey)) {
      set("encryptKey", generateRandomSecret());
    }
  }, [currentEncryptKey]);
  const loadGames = useCallback(async () => {
    if (!bridge) {
      return;
    }
    setLoadingGames(true);
    setServiceError("");
    try {
      const result = await bridge.invoke("getOpenPaasGameList");
      const nextGames = Array.isArray(result) ? result : result.games;
      const accessToken = Array.isArray(result) ? void 0 : result.accessToken;
      const uploadEnv = Array.isArray(result) ? void 0 : result.uploadEnv;
      const gamesList = Array.isArray(nextGames) ? nextGames : [];
      setGames(gamesList);
      if (accessToken !== void 0) {
        set("accessToken", accessToken);
      }
      if (uploadEnv) {
        set("uploadEnv", uploadEnv);
      }
      if (gamesList.length >= MAX_GAME_COUNT) {
        if (!appIdRef.current.trim()) {
          await applyGameRef.current(gamesList[gamesList.length - 1].id);
        }
      } else {
        const currentId = appIdRef.current.trim();
        if (currentId && !gamesList.some((game) => game.id === currentId)) {
          syncedAppIdRef.current = "";
          setContextReady(false);
          set("appid", "");
          set("context", {});
          set("context_ordered_json", "");
          set("context_signature", "");
          set("context_signature_version", "");
          set("public_key", "");
          set("package_id", "");
          set("privatePemPath", "");
        }
        if (!appIdRef.current.trim()) {
          try {
            const savedAppId = await bridge.invoke("getLastCreatedAppId");
            const fallbackId = String(savedAppId || "").trim();
            if (fallbackId && gamesList.some((game) => game.id === fallbackId)) {
              await applyGameRef.current(fallbackId);
            }
          } catch {
          }
        }
      }
    } catch (error) {
      setGames([]);
      setServiceError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingGames(false);
    }
  }, [bridge]);
  useEffect(() => {
    void loadGames();
  }, [loadGames]);
  const applyPackageContext = (payload) => {
    set("context", payload.context || {});
    set("context_ordered_json", payload.context_ordered_json || "");
    set("context_signature", payload.context_signature || "");
    set("context_signature_version", payload.context_signature_version === void 0 ? "" : String(payload.context_signature_version));
    set("public_key", payload.public_key || "");
    set("package_id", payload.package_id || "");
    set("privatePemPath", payload.privatePemPath || "");
    set("accessToken", payload.accessToken || "");
    if (payload.uploadEnv) {
      set("uploadEnv", payload.uploadEnv);
    }
    set("codeVersion", payload.codeVersion || stringValue(value.codeVersion));
    setContextReady(true);
  };
  const fetchPackageContext = async (gameId = currentAppId) => {
    if (!bridge || !gameId) {
      return;
    }
    setLoadingContext(true);
    setServiceError("");
    setContextReady(false);
    try {
      const payload = await bridge.invoke("getOpenPaasPackageContext", gameId, {
        includeWebPackage
      });
      applyPackageContext(payload);
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingContext(false);
    }
  };
  useEffect(() => {
    if (!bridge || !currentAppId) {
      syncedAppIdRef.current = "";
      return;
    }
    if (syncedAppIdRef.current === currentAppId) {
      return;
    }
    syncedAppIdRef.current = currentAppId;
    void fetchPackageContext(currentAppId);
  }, [bridge, currentAppId]);
  const applyGame = (gameId) => {
    if (gameId === CREATE_GAME_OPTION_VALUE) {
      void createGame();
      return;
    }
    syncedAppIdRef.current = gameId;
    setContextReady(false);
    set("appid", gameId);
    set("context", {});
    set("context_ordered_json", "");
    set("context_signature", "");
    set("context_signature_version", "");
    set("public_key", "");
    set("package_id", "");
    set("privatePemPath", "");
    const game = games.find((item) => item.id === gameId);
    set("codeVersion", game?.codeVersion || "");
    if (gameId) {
      void fetchPackageContext(gameId);
    }
  };
  applyGameRef.current = applyGame;
  const createGame = async () => {
    if (!bridge) {
      return;
    }
    if (games.length >= MAX_GAME_COUNT) {
      return;
    }
    setCreatingGame(true);
    setLoadingContext(true);
    setServiceError("");
    setContextReady(false);
    try {
      const payload = await bridge.invoke("createOpenPaasGame", {
        name: gameName,
        includeWebPackage
      });
      const gameId = stringValue(payload.gameId);
      if (!gameId) {
        throw new Error("OpenPaaS create game response is incomplete");
      }
      syncedAppIdRef.current = gameId;
      set("appid", gameId);
      applyPackageContext(payload);
      setGames((items) => {
        if (items.some((item) => item.id === gameId)) {
          return items;
        }
        return [{
          id: gameId,
          name: payload.gameName || gameName,
          label: `${gameId}${payload.gameName ? ` (${payload.gameName})` : ""}`,
          codeVersion: payload.codeVersion
        }, ...items];
      });
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingContext(false);
      setCreatingGame(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { width: "100%", minWidth: 0, boxSizing: "border-box" }, children: [
    /* @__PURE__ */ jsx("style", { children: HIDDEN_SCHEMA_FIELDS }),
    /* @__PURE__ */ jsx("div", { style: ROW, children: /* @__PURE__ */ jsx(TypedField, { label: `${t("service.game")}`, tooltip: t("service.game_hint"), children: /* @__PURE__ */ jsxs("div", { style: ACTION_ROW, children: [
      /* @__PURE__ */ jsx(
        "select",
        {
          style: SELECT,
          value: currentAppId,
          disabled: loadingGames || creatingGame,
          onChange: (event) => applyGame(event.target.value),
          children: loadingGames ? /* @__PURE__ */ jsx("option", { value: "", children: t("service.loading_games") }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("option", { value: "", disabled: games.length > 0, hidden: games.length > 0, children: t("service.game_placeholder") }),
            games.length < MAX_GAME_COUNT && /* @__PURE__ */ jsx("option", { value: CREATE_GAME_OPTION_VALUE, children: creatingGame ? t("service.creating_game") : t("service.create_game") }),
            games.map((game) => /* @__PURE__ */ jsx("option", { value: game.id, children: game.label }, game.id))
          ] })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          style: BUTTON,
          type: "button",
          disabled: loadingGames || creatingGame,
          onClick: () => void loadGames(),
          children: t("service.refresh_games")
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { style: ROW, children: [
      /* @__PURE__ */ jsx("div", { style: INFO, children: loadingContext ? t("service.loading_context") : contextReady ? t("service.context_ready") : stringValue(value.codeVersion) ? t("service.code_version", { codeVersion: stringValue(value.codeVersion) }) : "" }),
      serviceError && /* @__PURE__ */ jsx("div", { style: ERROR, children: serviceError })
    ] }),
    /* @__PURE__ */ jsx(
      NetworkTimeoutField,
      {
        label: t("options.network_timeout"),
        tooltip: t("options.network_timeout_hint"),
        value: value.networkTimeout,
        translate: t,
        onChange: (next) => set("networkTimeout", next)
      }
    )
  ] });
}
export {
  SudV2BuildView as default
};
