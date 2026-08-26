/**
 * ESM wrapper around the pinned runtime kit.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kit = require('./runtime-kit.cjs');

export const snapshotLooksReady = kit.engineLooksReady;
export const resolveEngineSnapshot = kit.resolveEngineSnapshot;
export const resolveNpmRoot = kit.resolveNpmRoot;
export const resolveUuidUtil = kit.resolveUuidUtil;
export const kitStatus = kit.kitStatus;
export const kitMissingHelp = kit.kitMissingHelp;
