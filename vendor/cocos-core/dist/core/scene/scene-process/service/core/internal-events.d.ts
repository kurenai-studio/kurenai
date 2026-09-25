export declare const InternalServiceEvents: {
    readonly EditorReloadClose: "editor:reload-close";
    readonly EditorReloadOpen: "editor:reload-open";
    readonly EditorDisposed: "editor:disposed";
};
export type InternalServiceEventName = typeof InternalServiceEvents[keyof typeof InternalServiceEvents];
