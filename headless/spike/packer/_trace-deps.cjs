// Trace which files get loaded during a build; write to trace.json
const path = require('path');
const fs = require('fs');
const NPM_ROOT = 'D:/tempWorkspace/headless-cocos-research/tmp-asar-root/node_modules';

const buildMod = require('./build.cjs');
buildMod.build().then(() => {
  const loaded = Object.keys(require.cache).filter(f =>
    f.replace(/\\/g, '/').toLowerCase().includes('/tmp-asar-root/')
  );
  // group by top-level package under tmp-asar-root
  const roots = {};
  for (const f of loaded) {
    const norm = f.replace(/\\/g, '/');
    const m = norm.match(/tmp-asar-root\/(node_modules\/(?:@[^/]+\/)?[^/]+|utils\/[^/]+)/i);
    if (!m) continue;
    const key = m[1];
    roots[key] = (roots[key] || 0) + 1;
  }
  const entries = Object.entries(roots).sort((a,b) => b[1]-a[1]);
  console.log('== loaded files by package ==');
  for (const [k,v] of entries) console.log(String(v).padStart(4), k);
  console.log('total files:', loaded.length);
  fs.writeFileSync('D:/tempWorkspace/headless-cocos-research/docker/loaded-files.json',
    JSON.stringify(loaded.map(f => f.replace(/\\/g,'/')), null, 2));
  console.log('written docker/loaded-files.json');
}).catch((e) => { console.error(e); process.exit(1); });
