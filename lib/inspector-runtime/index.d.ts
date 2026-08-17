//#region src/inspector-runtime/index.d.ts
type AnyRecord = Record<string, any>;
interface InspectorRuntime {
  refresh(): void;
  select(nodeId: string): void;
  setPickMode(enabled: boolean): void;
  dispose(): void;
}
interface InspectorRuntimeOptions {
  cocos?: AnyRecord;
  targetWindow?: Window;
}
declare function installInspectorRuntime(options?: InspectorRuntimeOptions): InspectorRuntime;
//#endregion
export { InspectorRuntime, InspectorRuntimeOptions, installInspectorRuntime };
//# sourceMappingURL=index.d.ts.map