import { XIAOMI, WECHAT, WECHAT_MINI_PROGRAM, TAOBAO_MINIGAME, TAOBAO } from 'internal:constants';

function findCanvas(){const container=document.createElement("div");return {frame:container,canvas:window.canvas,container}}function loadJsFile(path){if(XIAOMI){return require(`../../${path}`)}if(WECHAT||WECHAT_MINI_PROGRAM){return __wxRequire(path)}if(TAOBAO_MINIGAME){return globalThis.__taobaoRequire(path)}if(TAOBAO){return undefined}return require(`../${path}`)}

export { findCanvas, loadJsFile };
