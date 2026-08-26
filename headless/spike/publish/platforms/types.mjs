/**
 * @typedef {object} BundleIR
 * @property {string} name
 * @property {string} root
 * @property {string} dirRel
 * @property {object} config
 */

/**
 * @typedef {object} PublishIR
 * @property {1} version
 * @property {string} projectRoot
 * @property {string} assetsRoot
 * @property {string} libraryRoot
 * @property {string} internalLibraryRoot
 * @property {string} engineKit
 * @property {string} enginePreviewRoot
 * @property {string} engineNativeExternal
 * @property {string} shellCacheRoot
 * @property {string} scriptsRoot
 * @property {string} settingsJs
 * @property {string} mainConfigJson
 * @property {BundleIR[]} bundles
 * @property {string|null} launchScene
 * @property {Record<string, unknown>} meta
 */

/**
 * @typedef {object} EmitContext
 * @property {string} outDir
 * @property {(msg: string) => void} [log]
 */

/**
 * @typedef {object} EmitResult
 * @property {boolean} ok
 * @property {string} outDir
 * @property {string[]} [files]
 * @property {string[]} [warnings]
 * @property {string} [error]
 */

/**
 * @typedef {object} PlatformPlugin
 * @property {string} id
 * @property {string} [inherits]
 * @property {(ir: PublishIR, ctx: EmitContext) => Promise<EmitResult>} emit
 */

export {};
