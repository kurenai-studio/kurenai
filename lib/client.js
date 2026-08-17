window.__ModuleLoader__.load({id:`@kurenai-studio/dsh-plugin-kurenai`,factory:e=>{var t={exports:{}},n=t.exports;Object.defineProperty(n,Symbol.toStringTag,{value:`Module`});let r=e("react"),i=e("react/jsx-runtime");function a(e){if(!e||typeof e!=`object`)return!1;let t=e;return typeof t.type==`string`&&t.type.startsWith(`kurenai:`)&&t.version===1}function o(e){let t=[`[Kurenai selected Cocos node]`,`name: ${e.name}`,`path: ${e.path}`,`runtimeId: ${e.id}`,`active: ${e.active}`,`components: ${e.componentTypes.join(`, `)||`(none)`}`];return e.source?.assetUuid&&t.push(`assetUuid: ${e.source.assetUuid}`),e.source?.prefabFileId&&t.push(`prefabFileId: ${e.source.prefabFileId}`),e.source?.componentIndex!==void 0&&t.push(`componentIndex: ${e.source.componentIndex}`),t.join(`
`)}let s=`kurenai.previewUrl`,c=`kurenai.viewport`,l=`http://127.0.0.1:7461/`,u=[[`fit`,`Fit`],[`1280x720`,`1280 × 720`],[`720x1280`,`720 × 1280`],[`393x852`,`iPhone 14 Pro`],[`360x800`,`Android 360 × 800`]];function d({workspaceName:e,initialPreviewUrl:t,onClose:n,onStopAndClose:l,onSelectionChange:d}){let[g,_]=(0,r.useState)(()=>t??f()),[v,y]=(0,r.useState)(g),[b,x]=(0,r.useState)(null),[S,C]=(0,r.useState)(!1),[w,T]=(0,r.useState)(!1),[E,D]=(0,r.useState)(p),[O,k]=(0,r.useState)({width:0,height:0}),A=(0,r.useRef)(null),j=(0,r.useRef)(null),M=(0,r.useCallback)(e=>{A.current?.contentWindow?.postMessage(e,`*`)},[]);(0,r.useEffect)(()=>{let e=e=>{if(e.source!==A.current?.contentWindow||!a(e.data))return;let t=e.data;t.type===`kurenai:ready`?T(!0):t.type===`kurenai:selection`&&(x(t.node),d?.(t.node),window.dispatchEvent(new CustomEvent(`kurenai:selection`,{detail:t.node})))};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[d,M]),(0,r.useEffect)(()=>{if(!n)return;let e=e=>{e.key===`Escape`&&n()};return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},[n]),(0,r.useEffect)(()=>{t&&(_(t),y(t))},[t]),(0,r.useEffect)(()=>{let e=j.current;if(!e)return;let t=new ResizeObserver(([e])=>{e&&k({width:e.contentRect.width,height:e.contentRect.height})});return t.observe(e),()=>t.disconnect()},[]);let N=(0,r.useMemo)(()=>b?o(b):``,[b]),P=()=>{let e=h(v);localStorage.setItem(s,e),_(e),T(!1),x(null)},F=()=>{let e=!S;C(e),M({type:`kurenai:set-pick-mode`,version:1,enabled:e})},I=async()=>{N&&await navigator.clipboard.writeText(N)},L=e=>{D(e),localStorage.setItem(c,JSON.stringify(e))},R=E.preset===`fit`?1:Math.min(1,Math.max(.1,(O.width-16)/E.width),Math.max(.1,(O.height-16)/E.height));return(0,i.jsxs)(`section`,{className:`kurenai-workspace`,"aria-label":`Kurenai Studio`,children:[(0,i.jsxs)(`header`,{className:`kurenai-toolbar`,children:[(0,i.jsx)(`span`,{className:`kurenai-title`,children:e?`Kurenai · ${e}`:`Kurenai Studio`}),(0,i.jsxs)(`select`,{className:`kurenai-select`,value:E.preset,onChange:e=>{let t=e.currentTarget.value;if(t===`fit`){L({...E,preset:t});return}let[n,r]=t.split(`x`).map(Number);n&&r&&L({preset:t,width:n,height:r})},"aria-label":`Preview resolution`,children:[u.map(([e,t])=>(0,i.jsx)(`option`,{value:e,children:t},e)),(0,i.jsx)(`option`,{value:`custom`,children:`Custom`})]}),E.preset===`fit`?null:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`input`,{className:`kurenai-size-input`,type:`number`,min:240,max:4096,value:E.width,onChange:e=>L({...E,preset:`custom`,width:m(e.currentTarget.value)}),"aria-label":`Preview width`}),(0,i.jsx)(`span`,{className:`kurenai-size-times`,children:`×`}),(0,i.jsx)(`input`,{className:`kurenai-size-input`,type:`number`,min:240,max:4096,value:E.height,onChange:e=>L({...E,preset:`custom`,height:m(e.currentTarget.value)}),"aria-label":`Preview height`}),(0,i.jsx)(`button`,{className:`kurenai-button`,onClick:()=>L({preset:`custom`,width:E.height,height:E.width}),children:`Rotate`})]}),(0,i.jsx)(`button`,{className:`kurenai-button`,"data-active":S,disabled:!w,onClick:F,children:`Pick`}),b?(0,i.jsx)(`button`,{className:`kurenai-button kurenai-selection-chip`,title:b.path,onClick:()=>void I(),children:b.name}):null,n?(0,i.jsx)(`button`,{className:`kurenai-button`,onClick:n,children:`Hide`}):null,l?(0,i.jsx)(`button`,{className:`kurenai-button kurenai-stop-button`,onClick:l,children:`Stop`}):null,(0,i.jsxs)(`div`,{className:`kurenai-url-row`,children:[(0,i.jsx)(`input`,{className:`kurenai-input`,value:v,onChange:e=>y(e.currentTarget.value),onKeyDown:e=>{e.key===`Enter`&&P()},"aria-label":`Headless Cocos preview URL`}),(0,i.jsx)(`button`,{className:`kurenai-button`,onClick:P,children:`Open`})]})]}),(0,i.jsx)(`div`,{className:`kurenai-main`,children:(0,i.jsx)(`div`,{ref:j,className:`kurenai-preview-stage`,children:(0,i.jsx)(`div`,{className:`kurenai-preview-viewport`,"data-fit":E.preset===`fit`,style:E.preset===`fit`?void 0:{width:`${E.width}px`,height:`${E.height}px`,transform:`translate(-50%, -50%) scale(${R})`},children:(0,i.jsx)(`iframe`,{ref:A,className:`kurenai-preview`,title:`Headless Cocos preview`,src:g,onLoad:()=>{T(!1)}})})})})]})}function f(){return localStorage.getItem(s)||l}function p(){try{let e=JSON.parse(localStorage.getItem(c)??``);if(typeof e.preset==`string`&&typeof e.width==`number`&&typeof e.height==`number`)return{preset:e.preset,width:m(e.width),height:m(e.height)}}catch{}return{preset:`fit`,width:1280,height:720}}function m(e){let t=Number(e);return Math.min(4096,Math.max(240,Number.isFinite(t)?t:240))}function h(e){let t=new URL(e.trim()||l);if(t.protocol!==`http:`&&t.protocol!==`https:`)throw Error(`Preview URL must use http or https`);return t.toString()}let g={async defaultPath(){return(await v(`/api/project/default`)).projectPath},state(e,t){return v(`/api/project?sessionId=${encodeURIComponent(e)}&projectPath=${encodeURIComponent(t)}`)},initialize(e,t,n){return _(`/api/project/initialize`,{sessionId:e,projectPath:t,template:n})},startPreview(e,t){return _(`/api/preview/start`,{sessionId:e,projectPath:t})},stopPreview(e,t){return _(`/api/preview/stop`,{sessionId:e,projectPath:t})},setSelection(e,t,n){return v(`/api/context/selection`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({sessionId:e,projectPath:t,selection:n})})}};async function _(e,t){return v(e,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify(t)})}async function v(e,t){let n=localStorage.getItem(`kurenai.controlUrl`)?.replace(/\/+$/u,``)??`http://127.0.0.1:7459`,r=await fetch(`${n}${e}`,t),i=await r.json();if(!r.ok)throw Error(i.error??`Kurenai control failed: HTTP ${r.status}`);return i}function y({sessionId:e,projectPath:t,onClose:n}){let[a,o]=(0,r.useState)(null),[s,c]=(0,r.useState)(),[l,u]=(0,r.useState)(),[f,p]=(0,r.useState)(!1),m=(0,r.useCallback)(async()=>{if(!e||!t){o(null),c(void 0);return}try{u(void 0);let n=await g.state(e,t);if(o(n),c(n.preview),n.project&&n.preview?.phase!==`ready`){let n=await g.startPreview(e,t);c(n.preview)}}catch(e){u(x(e))}},[t,e]);(0,r.useEffect)(()=>{m()},[m]);let h=async n=>{if(!(!e||!t)){p(!0),u(void 0);try{let r=await g.initialize(e,t,n);r.state&&o(r.state),c(r.preview)}catch(e){u(x(e))}finally{p(!1)}}},_=(0,r.useCallback)(async()=>{if(e&&t)try{await g.stopPreview(e,t)}catch(e){console.warn(`[kurenai] failed to stop preview`,e)}n()},[n,t,e]),v=(0,r.useCallback)(async n=>{if(!(!e||!t))try{await g.setSelection(e,t,n)}catch(e){console.warn(`[kurenai] failed to sync selection`,e)}},[t,e]);return!e||!t?(0,i.jsx)(b,{title:`Kurenai Studio`,onClose:n,children:(0,i.jsx)(`p`,{className:`kurenai-setup-lead`,children:`Open a DSH workspace and conversation before starting Kurenai.`})}):a?.project&&s?.url?(0,i.jsx)(d,{sessionId:e,workspaceName:a.project.name,initialPreviewUrl:s.url,onClose:n,onStopAndClose:()=>void _(),onSelectionChange:v}):(0,i.jsxs)(b,{title:`Initialize Cocos`,onClose:n,children:[(0,i.jsx)(`p`,{className:`kurenai-setup-lead`,children:`Kurenai directly uses the current DSH workspace directory.`}),(0,i.jsxs)(`dl`,{className:`kurenai-project-facts`,children:[(0,i.jsx)(`dt`,{children:`DSH workspace`}),(0,i.jsx)(`dd`,{children:t}),(0,i.jsx)(`dt`,{children:`Session`}),(0,i.jsx)(`dd`,{children:e})]}),l?(0,i.jsx)(`p`,{className:`kurenai-error`,children:l}):null,(0,i.jsxs)(`div`,{className:`kurenai-template-options`,children:[(0,i.jsxs)(`button`,{className:`kurenai-template-option`,disabled:f,onClick:()=>void h(`base-ai`),children:[(0,i.jsx)(`strong`,{children:`2D`}),(0,i.jsx)(`span`,{children:`Canvas, UI, 2D physics and playable-oriented modules`})]}),(0,i.jsxs)(`button`,{className:`kurenai-template-option`,disabled:f,onClick:()=>void h(`base-ai-3d`),children:[(0,i.jsx)(`strong`,{children:`3D`}),(0,i.jsx)(`span`,{children:`Perspective camera, light, primitive and 3D modules`})]})]}),f?(0,i.jsx)(`p`,{className:`kurenai-muted`,children:`Initializing template…`}):null,(0,i.jsx)(`p`,{className:`kurenai-muted`,children:`For an existing project, open its directory as a DSH workspace; Kurenai will detect it automatically.`})]})}function b({title:e,children:t,onClose:n}){return(0,i.jsxs)(`section`,{className:`kurenai-workspace kurenai-workspace-setup`,children:[(0,i.jsxs)(`header`,{className:`kurenai-toolbar`,children:[(0,i.jsx)(`span`,{className:`kurenai-title`,children:e}),(0,i.jsx)(`button`,{className:`kurenai-button`,onClick:n,children:`Hide`})]}),(0,i.jsx)(`div`,{className:`kurenai-setup-body`,children:t})]})}function x(e){return e instanceof Error?e.message:String(e)}let S=`kurenai:toggle-workspace`,C=`kurenai.panelWidth.v2`;function w({useSessions:e,ensureWorkspaceSession:t}){let[n,a]=(0,r.useState)(!1),o=e(e=>e.current),s=e(e=>e.current?e.byId[e.current]?.cwd:void 0);return(0,i.jsx)(`button`,{className:`kurenai-launcher`,disabled:n,onClick:()=>{(async()=>{a(!0);try{let e=o&&s?{sessionId:o,projectPath:s}:await t?.();window.dispatchEvent(new CustomEvent(S,{detail:e}))}finally{a(!1)}})()},children:n?`Opening…`:`Kurenai`})}function T({sessionId:e,useSessions:t}){let n=t(t=>t.byId[e]?.cwd);return(0,i.jsx)(`button`,{className:`kurenai-header-button`,onClick:()=>window.dispatchEvent(new CustomEvent(S,{detail:{sessionId:e,projectPath:n}})),children:`Kurenai`})}function E({useSessions:e}){let[t,n]=(0,r.useState)(!1),a=e(e=>e.current),o=e(e=>e.current?e.byId[e.current]?.cwd:void 0),[s,c]=(0,r.useState)(),[l,u]=(0,r.useState)(),[d,f]=(0,r.useState)(D),p=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e=e=>{let t=e.detail;c(t?.sessionId),u(t?.projectPath),n(e=>!e)};return window.addEventListener(S,e),()=>window.removeEventListener(S,e)},[]),(0,r.useEffect)(()=>{if(!t)return;let e=document.querySelector(`[data-shell-overlay]`),n=e?.parentElement;if(!e||!n)return;p.current=n;let r={boxSizing:n.style.boxSizing,paddingRight:n.style.paddingRight,panelWidth:document.documentElement.style.getPropertyValue(`--kurenai-panel-width`)},i=()=>O(n,d);return document.body.classList.add(`kurenai-split-open`),i(),window.addEventListener(`resize`,i),()=>{window.removeEventListener(`resize`,i),p.current=null,document.body.classList.remove(`kurenai-split-open`),n.style.boxSizing=r.boxSizing,n.style.paddingRight=r.paddingRight,r.panelWidth?document.documentElement.style.setProperty(`--kurenai-panel-width`,r.panelWidth):document.documentElement.style.removeProperty(`--kurenai-panel-width`)}},[t,d]),t?(0,i.jsxs)(`div`,{className:`kurenai-split-panel`,children:[(0,i.jsx)(`div`,{className:`kurenai-split-handle`,role:`separator`,"aria-orientation":`vertical`,onPointerDown:e=>{let t=p.current;if(!t)return;e.preventDefault(),e.currentTarget.setPointerCapture(e.pointerId);let n=e=>{let n=t.firstElementChild?.getBoundingClientRect().width??0,r=window.innerWidth-n;if(r<680)return;let i=Math.min(1400,Math.max(360,r-240)),a=Math.round(Math.min(i,Math.max(360,window.innerWidth-e.clientX)));f(a),localStorage.setItem(C,String(a))},r=()=>{window.removeEventListener(`pointermove`,n),window.removeEventListener(`pointerup`,r)};window.addEventListener(`pointermove`,n),window.addEventListener(`pointerup`,r,{once:!0})}}),(0,i.jsx)(y,{sessionId:s??a,projectPath:l??o,onClose:()=>n(!1)})]}):null}function D(){let e=Number(localStorage.getItem(C));return Number.isFinite(e)&&e>=360?e:Math.round(Math.min(760,Math.max(520,window.innerWidth*.6)))}function O(e,t){let n=window.innerWidth,r=e.firstElementChild?.getBoundingClientRect().width??0,i=Math.max(0,n-r),a=i>=680,o=Math.min(1400,Math.max(360,i-240)),s=a?Math.min(o,Math.max(360,t)):n;document.documentElement.style.setProperty(`--kurenai-panel-width`,`${s}px`),e.style.boxSizing=`border-box`,e.style.paddingRight=a?`${s}px`:`0`}let k=`kurenai-studio-style`;function A(){if(document.getElementById(k))return;let e=document.createElement(`style`);e.id=k,e.textContent=`
.kurenai-launcher {
  width: 100%;
  min-height: 34px;
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 7px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.kurenai-launcher:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.kurenai-header-button {
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 4px 8px;
  cursor: pointer;
  font: inherit;
}
.kurenai-header-button:hover {
  border-color: #d33b4f;
  color: #d33b4f;
}
body.kurenai-split-open [data-shell-overlay] {
  pointer-events: none;
}
.kurenai-split-panel {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--kurenai-panel-width, 52vw);
  pointer-events: auto;
  border-left: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  background: var(--background, #111);
  color: var(--foreground, #f3f3f3);
}
.kurenai-split-handle {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  left: -5px;
  width: 10px;
  cursor: col-resize;
  touch-action: none;
}
.kurenai-split-handle::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 4px;
  border-radius: 4px;
  background: color-mix(in srgb, currentColor 28%, transparent);
}
.kurenai-split-handle:hover::after {
  background: #d33b4f;
}
.kurenai-workspace {
  width: 100%;
  height: 100%;
  min-height: 480px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  color: var(--foreground, #f3f3f3);
  background: var(--background, #111);
}
.kurenai-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 44px;
  padding: 6px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 18%, transparent);
}
.kurenai-title {
  font-weight: 650;
  margin-right: auto;
}
.kurenai-input {
  flex: 1 1 auto;
  min-width: 160px;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 6px 8px;
}
.kurenai-url-row {
  display: flex;
  flex: 1 0 100%;
  gap: 8px;
}
.kurenai-selection-chip {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kurenai-select,
.kurenai-size-input {
  height: 30px;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  border-radius: 6px;
  background: var(--background, #111);
  color: inherit;
}
.kurenai-select {
  max-width: 140px;
  padding: 0 6px;
}
.kurenai-size-input {
  width: 64px;
  padding: 0 5px;
}
.kurenai-size-times {
  opacity: .55;
}
.kurenai-button {
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 6px 9px;
  cursor: pointer;
}
.kurenai-button[data-active="true"] {
  border-color: #d33b4f;
  color: #d33b4f;
}
.kurenai-stop-button {
  border-color: color-mix(in srgb, #d33b4f 58%, transparent);
  color: #ef7a89;
}
.kurenai-main {
  min-height: 0;
  min-width: 0;
}
.kurenai-preview-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  height: 100%;
  background:
    linear-gradient(45deg, #111 25%, transparent 25%) 0 0 / 16px 16px,
    linear-gradient(45deg, transparent 75%, #111 75%) 0 0 / 16px 16px,
    linear-gradient(45deg, transparent 75%, #111 75%) 8px -8px / 16px 16px,
    linear-gradient(45deg, #111 25%, #0b0b0b 25%) 8px -8px / 16px 16px;
}
.kurenai-preview-viewport {
  position: absolute;
  top: 50%;
  left: 50%;
  overflow: hidden;
  transform-origin: center;
  background: #090909;
  border: 1px solid color-mix(in srgb, white 18%, transparent);
  box-shadow: 0 12px 40px rgb(0 0 0 / 45%);
}
.kurenai-preview-viewport[data-fit="true"] {
  inset: 0;
  width: auto;
  height: auto;
  transform: none;
}
.kurenai-preview {
  width: 100%;
  height: 100%;
  border: 0;
  background: #090909;
}
.kurenai-inspector {
  min-height: 0;
  overflow: auto;
  border-left: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  padding: 10px;
}
.kurenai-inspector h3 {
  font-size: 12px;
  margin: 0 0 8px;
  opacity: .65;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.kurenai-tree {
  list-style: none;
  margin: 0;
  padding: 0 0 0 10px;
}
.kurenai-tree button {
  width: 100%;
  text-align: left;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  padding: 4px 6px;
  cursor: pointer;
}
.kurenai-tree button:hover,
.kurenai-tree button[data-selected="true"] {
  background: color-mix(in srgb, currentColor 9%, transparent);
}
.kurenai-selection {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.kurenai-muted {
  opacity: .6;
  font-size: 12px;
}
.kurenai-workspace-setup {
  overflow: hidden;
}
.kurenai-setup-body {
  min-height: 0;
  overflow: auto;
  padding: 24px;
}
.kurenai-setup-lead {
  margin: 0 0 20px;
  font-size: 15px;
}
.kurenai-project-facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 14px;
  margin: 0 0 20px;
  font-size: 12px;
}
.kurenai-project-facts dt {
  opacity: .55;
}
.kurenai-project-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.kurenai-error {
  border: 1px solid #d33b4f;
  border-radius: 6px;
  padding: 10px;
  color: #d33b4f;
  overflow-wrap: anywhere;
}
.kurenai-primary {
  align-self: flex-start;
  border-color: #d33b4f;
  color: #d33b4f;
}
.kurenai-template-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.kurenai-template-option {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  padding: 16px;
  text-align: left;
  cursor: pointer;
}
.kurenai-template-option:hover {
  border-color: #d33b4f;
}
.kurenai-template-option strong {
  font-size: 18px;
}
.kurenai-template-option span {
  opacity: .6;
  font-size: 12px;
}
@media (max-width: 719px) {
  .kurenai-split-panel {
    width: 100vw;
  }
  .kurenai-split-handle {
    display: none;
  }
  .kurenai-template-options {
    grid-template-columns: 1fr;
  }
}
`,document.head.appendChild(e)}let j=[`slots`,`workspaces`,`sessions`];function M(e){A(),e.slots.inject(`sidebar.footer.action`,()=>e.slots.register({name:`sidebar.footer.action`,id:`kurenai-open`,order:20,inject:()=>({ensureWorkspaceSession:async()=>{let t=await g.defaultPath(),n=await e.workspaces.create({path:t}),r=await e.workspaces.connectWorkspace(n.id);return e.sessions.open(r),{sessionId:r,projectPath:t}}})},w)),e.slots.inject(`shell.overlay`,()=>e.slots.register({name:`shell.overlay`,id:`kurenai-workspace`,order:20,inject:()=>({})},E)),e.slots.inject(`conversation.session.header.actions`,()=>e.slots.register({name:`conversation.session.header.actions`,id:`kurenai-conversation`,order:80,inject:()=>({})},T))}return n.apply=M,n.inject=j,t.exports}});