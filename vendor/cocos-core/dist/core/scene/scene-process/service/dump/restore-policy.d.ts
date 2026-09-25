/**
 * 快照恢复策略：定义 undo/redo 恢复时，哪些属性可以安全写回。
 *
 * Node/component 的快照恢复策略需要和 dump encode 函数保持一致：
 * - NODE_SNAPSHOT_RESTORE_PROPERTY_PATHS  ↔  encodeNode()  (encode.ts)
 * - COMPONENT_SNAPSHOT_RESTORE_SKIP_KEYS  ↔  encodeComponent()  (encode.ts)
 *
 * Scene 的恢复器不负责决定一个属性是否应该进入 undo；
 * 它只负责恢复已经由 Scene 编辑 API 纳入 snapshot command 的属性。
 * 对普通 Scene 属性可以按 IProperty dump 形状恢复，name、locked、uuid 仍由特殊规则处理。
 */
/**
 * Node 快照可恢复属性路径（白名单）。
 *
 * undo/redo 从 node 快照 dump 恢复时，只会写回这些属性。
 * 结构字段（uuid、parent、children、__comps__、__type__、__prefab__ 等）
 * 不在这里恢复，因为它们由 node-structure command 管理，不由 snapshot command 管理。
 *
 * `name` 和 `locked` 也不在这里恢复，因为它们需要特殊处理：
 * `name` 需要通知编辑器名称映射，`locked` 需要操作 objFlags bit；
 * 这两个属性由 undo 层单独处理。
 */
export declare const NODE_SNAPSHOT_RESTORE_PROPERTY_PATHS: readonly ["active", "layer", "mobility", "position", "rotation", "scale"];
/**
 * Scene 快照中由 undo 层特殊处理或属于身份的字段。
 *
 * 普通 Scene 属性可以复用通用 snapshot 恢复器；
 * 但是否纳入 undo 仍由 Scene 编辑 API 的持久化/可编辑性契约决定，不能由 dump 形状推断。
 */
export declare const SCENE_SNAPSHOT_SPECIAL_PROPERTY_KEYS: readonly ["name", "locked", "uuid"];
/**
 * Component 快照身份字段 / 编辑器内部字段（黑名单）。
 *
 * 恢复 component 快照 dump 时会跳过这些 key。
 * `dump.value` 里的其他 key 会被当成用户可编辑属性，
 * 并交给 `restoreProperty` 写回。
 */
export declare const COMPONENT_SNAPSHOT_RESTORE_SKIP_KEYS: readonly ["uuid", "node", "__scriptAsset", "__eventTargets"];
