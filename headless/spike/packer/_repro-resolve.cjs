// Standalone repro inside the container for debugging entry resolution.
const path = require('path');
const NPM = process.env.NPM_ROOT;
const { ModLo } = require(path.join(NPM, '@cocos/creator-programming-mod-lo/lib/mod-lo'));

const modLo = new ModLo({
  transformer: 'babel',
  targets: 'chrome 100',
  loose: true,
  _importMetaURLValid: true,
  _compressUUID: (u) => u,
  hot: true,
  logger: {
    debug: (m) => console.log('[dbg]', m),
    info:  (m) => console.log('[inf]', m),
    warn:  (m) => console.log('[wrn]', m),
    error: (m) => console.log('[err]', m),
  },
});

const prefix = 'file:///D:/tempWorkspace/baseAIAutoCocos/assets/';
modLo.setExternals(['cc']);
modLo.setAssetPrefixes([prefix]);

const url = prefix + 'scripts/HeadlessProbe.ts';
console.log('adding memory module:', url);
modLo.addMemoryModule(url, 'export const X = 1;');

console.log('resolve without from:');
try { console.log(JSON.stringify(modLo.resolve(url, undefined, 'esm'))); }
catch (e) { console.log('THROW:', e.message); }

console.log('resolve with prefix as parent:');
try { console.log(JSON.stringify(modLo.resolve(url, new (require('url').URL)(prefix), 'esm'))); }
catch (e) { console.log('THROW:', e.message); }

console.log('load:');
try {
  const mod = modLo.load(new (require('url').URL)(url));
  console.log('loaded, systemjs:', String(mod.systemjs).slice(0, 60));
} catch (e) { console.log('LOAD THROW:', e.message); }
