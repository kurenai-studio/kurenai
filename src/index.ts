export {
  DEFAULT_COCOS_CLI_ROOT,
  resolveCocosCliRoot,
} from "./cocos/paths.js";
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
