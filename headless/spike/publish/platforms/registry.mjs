import { webPlatform } from './web.mjs';

/** @type {Map<string, import('./types.mjs').PlatformPlugin>} */
const builtins = new Map([[webPlatform.id, webPlatform]]);

/**
 * @param {string} id
 * @returns {import('./types.mjs').PlatformPlugin | undefined}
 */
export function getPlatformPlugin(id) {
  return builtins.get(id);
}

export function listPlatformPlugins() {
  return [...builtins.keys()];
}

/**
 * Resolve plugin chain (inherits first).
 * @param {string} id
 */
export function resolvePlatformChain(id) {
  const chain = [];
  let cur = id;
  const seen = new Set();
  while (cur) {
    if (seen.has(cur)) throw new Error(`platform inherit cycle at ${cur}`);
    seen.add(cur);
    const plugin = getPlatformPlugin(cur);
    if (!plugin) throw new Error(`Unknown platform plugin: ${cur}`);
    chain.unshift(plugin);
    cur = plugin.inherits;
  }
  return chain;
}
