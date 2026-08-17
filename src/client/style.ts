const STYLE_ID = "kurenai-studio-style";

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
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
`;
  document.head.appendChild(style);
}
