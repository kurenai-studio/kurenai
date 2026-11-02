// Import from "wanaka-studio-engine/persistence".

import type { DiagnosticsPort } from "wanaka-studio-engine";
import type { LifetimeScope } from "wanaka-studio-engine";
import { IdentityRegistry } from "wanaka-studio-engine/identity";

export const SAVE_SCHEMA: 'wanaka-game-save';

export const SAVE_VERSION: 1;

/** The complete Game save document; old schemas are rejected, not read. */
export interface SaveDocument {
    readonly schema: typeof SAVE_SCHEMA;
    readonly version: typeof SAVE_VERSION;
    readonly savedAtMs: number;
    readonly entities: Record<string, unknown>;
}

/** Storage adapter; production uses IndexedDB, tests use memory. */
export interface SaveStorage {
    read(slot: string): Promise<unknown>;
    write(slot: string, document: SaveDocument): Promise<void>;
    remove(slot: string): Promise<void>;
    dispose?(): void | Promise<void>;
}

export interface PersistenceBindingOptions {
    /** Stable save identity; never a Three UUID. */
    readonly saveKey: string;
    /**
     * Presentation or gameplay object that needs this SaveKey. Omit for
     * bindings that are not tied to an Object3D.
     */
    readonly host?: object;
    /** Captures the explicit persistent state; JSON-serializable only. */
    readonly capture: () => unknown;
    /** Restores from a captured value on load. */
    readonly restore: (value: unknown) => void;
}

export interface PersistenceSessionOptions {
    readonly storage: SaveStorage;
    readonly diagnostics?: DiagnosticsPort;
    readonly now?: () => number;
    readonly ownsStorage?: boolean;
    /** Shared identity registry owned by the enclosing RuntimeSession. */
    readonly identity: IdentityRegistry;
}

/**
 * Explicit persistent-state projection for one RuntimeSession. Only
 * registered bindings are captured — runtime-only, Jolt, and DOM state
 * never serialize. Old save schemas fail loud; there is no migration
 * fallback from pre-Game formats.
 */
export class PersistenceSession {
    private constructor();
    /**
     * Creates the one persistence session for this RuntimeSession identity.
     * Pass the runtime session scope (`session.scope` / `context.session.scope`),
     * not the scene child `context.scope`. Scene replacement disposes scene-local
     * resources; Play hosts keep the handle captured at boot. A second create for
     * the same identity throws — `activateGame` may run more than once.
     */
    static create(scope: LifetimeScope, options: PersistenceSessionOptions): PersistenceSession;
    /** Registers one explicitly persistent entity; the owner scope unregisters it. */
    registerBinding(scope: LifetimeScope, binding: PersistenceBindingOptions): void;
    /** True while this saveKey has a live binding. Scene-owned bindings become false after that scene is replaced. */
    hasBinding(saveKey: string): boolean;
    /** Captures every binding and writes one versioned save document. */
    save(slot: string): Promise<SaveDocument>;
    /**
     * Restores a saved slot. Returns false when the slot is empty. A document
     * with a foreign schema or version is rejected loudly — never partially
     * applied or silently migrated.
     */
    load(slot: string): Promise<boolean>;
}
