export { checkPackageSize, readGameJson, WECHAT_LIMITS } from "./size.js";
export type { PackageSizeReport, SubpackageSize } from "./size.js";
export { sizeHints } from "./hints.js";
export type { SizeHint } from "./hints.js";
export {
  configureSubpackages,
  detectCreatorLine,
  removeSubpackages,
  SUBPACKAGE_BUNDLE_CONFIG,
  SUBPACKAGE_CONFIG_ID,
} from "./subpackage.js";
export type { CreatorLine, SubpackageResult } from "./subpackage.js";
export { proposeSubpackages } from "./propose-subpackages.js";
export type { ProposeSubpackagesResult, SubpackageCandidate } from "./propose-subpackages.js";
export { preview, resolveCredentials, setProjectAppid, upload } from "./ci.js";
export type { CiOptions, CiResult, Credentials, MiniprogramCi } from "./ci.js";
export { installPlugin, pluginInfo } from "./plugin.js";
