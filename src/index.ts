export {
  DEFAULT_COCOS_CLI_ROOT,
  KURENAI_COCOS_CORE_VERSION,
  LEGACY_PINK_COCOS_CLI_ROOT,
  managedCocosCoreRoot,
  resolveCocosCliRoot,
} from "./cocos/paths.js";
export {
  ensureCorePack,
  ensurePacks,
  inspectPack,
  listKnownPackIds,
  packsForPlatform,
  packsStatus,
} from "./cocos/packs.js";
export type {
  EnsurePacksOptions,
  EnsurePacksResult,
  PackId,
  PackPresence,
  PacksStatus,
} from "./cocos/packs.js";
export { PreviewBridge, injectInspector } from "./preview/bridge.js";
export type { PreviewBridgeConfig } from "./preview/bridge.js";
export { PreviewController } from "./preview/controller.js";
export type {
  PreviewConfig,
  PreviewControllerOptions,
  PreviewPhase,
  PreviewState,
} from "./preview/controller.js";
export { ProjectControl } from "./project/control.js";
export type {
  CocosProject,
  CommandResult,
  ProjectControlConfig,
  ProjectTemplateId,
  PublishPlatform,
  SelectionContext,
} from "./project/control.js";
export * from "./shared/protocol.js";
